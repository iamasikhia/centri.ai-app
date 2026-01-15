import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Service to manage OAuth token refresh for all integrations
 */
@Injectable()
export class TokenRefreshService {
    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
        private config: ConfigService
    ) { }

    /**
     * Get a valid access token for an integration, refreshing if needed
     */
    async getValidToken(integrationId: string): Promise<{ accessToken: string; refreshed: boolean } | null> {
        const integration = await this.prisma.integrations.findUnique({
            where: { id: integrationId }
        });

        if (!integration) return null;

        let tokenData: any = null;

        // Decrypt the token blob
        if (integration.encryptedBlob) {
            try {
                const decrypted = this.encryption.decrypt(integration.encryptedBlob);
                tokenData = JSON.parse(decrypted);
            } catch (e) {
                console.error(`[TokenRefresh] Failed to decrypt token for ${integration.provider}`, e);
                return null;
            }
        }

        if (!tokenData?.access_token) {
            return null;
        }

        // Check if token is expired (Google tokens expire in 1 hour)
        // We'll proactively refresh if we have a refresh token
        const expiresAt = tokenData.expires_at || tokenData.expiry_date;
        const isExpired = expiresAt ? Date.now() > expiresAt - 60000 : false; // 1 min buffer

        if (isExpired && tokenData.refresh_token) {
            console.log(`[TokenRefresh] Token expired for ${integration.provider}, refreshing...`);

            try {
                const newTokens = await this.refreshToken(integration.provider, tokenData.refresh_token);

                if (newTokens?.access_token) {
                    // Merge new tokens with existing (preserve refresh_token if not returned)
                    const updatedTokenData = {
                        ...tokenData,
                        access_token: newTokens.access_token,
                        expires_in: newTokens.expires_in,
                        expires_at: Date.now() + (newTokens.expires_in || 3600) * 1000,
                        refresh_token: newTokens.refresh_token || tokenData.refresh_token
                    };

                    // Save updated tokens back to DB
                    await this.prisma.integrations.update({
                        where: { id: integrationId },
                        data: {
                            encryptedBlob: this.encryption.encrypt(JSON.stringify(updatedTokenData)),
                            updatedAt: new Date()
                        }
                    });

                    console.log(`[TokenRefresh] Token refreshed successfully for ${integration.provider}`);
                    return { accessToken: newTokens.access_token, refreshed: true };
                }
            } catch (e) {
                console.error(`[TokenRefresh] Failed to refresh token for ${integration.provider}`, e.message);
                // Return the old token anyway - it might still work
            }
        }

        return { accessToken: tokenData.access_token, refreshed: false };
    }

    /**
     * Refresh token based on provider type
     */
    private async refreshGoogle(refreshToken: string): Promise<any> {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

        const response = await axios.post('https://oauth2.googleapis.com/token', {
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
        });
        return response.data;
    }

    private async refreshGitHub(refreshToken: string): Promise<any> {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');

        const response = await axios.post('https://github.com/login/oauth/access_token', {
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
        }, {
            headers: { Accept: 'application/json' }
        });
        return response.data;
    }

    private async refreshSlack(refreshToken: string): Promise<any> {
        const clientId = this.config.get('SLACK_CLIENT_ID');
        const clientSecret = this.config.get('SLACK_CLIENT_SECRET');

        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
            }
        });
        return response.data;
    }

    private async refreshToken(provider: string, refreshToken: string): Promise<any> {
        switch (provider) {
            case 'google':
            case 'gmail':
            case 'google-calendar':
            case 'google-drive':
            case 'google-docs':
            case 'google-meet':
                return this.refreshGoogle(refreshToken);
            case 'github':
                return this.refreshGitHub(refreshToken);
            case 'slack':
                return this.refreshSlack(refreshToken);
            default:
                console.warn(`[TokenRefresh] No refresh handler for provider: ${provider}`);
                return null;
        }
    }

    /**
     * Try to make an API call, and if it fails with 401, refresh the token and retry
     */
    async withAutoRefresh<T>(
        integrationId: string,
        apiCall: (accessToken: string) => Promise<T>
    ): Promise<{ data: T | null; error?: string }> {
        const tokenResult = await this.getValidToken(integrationId);

        if (!tokenResult) {
            return { data: null, error: 'No valid token' };
        }

        try {
            const data = await apiCall(tokenResult.accessToken);
            return { data };
        } catch (error: any) {
            // If 401, try refreshing the token
            if (error.response?.status === 401) {
                console.log(`[TokenRefresh] Got 401, attempting token refresh...`);

                const integration = await this.prisma.integrations.findUnique({
                    where: { id: integrationId }
                });

                if (integration?.encryptedBlob) {
                    try {
                        const decrypted = this.encryption.decrypt(integration.encryptedBlob);
                        const tokenData = JSON.parse(decrypted);

                        if (tokenData.refresh_token) {
                            const newTokens = await this.refreshToken(integration.provider, tokenData.refresh_token);

                            if (newTokens?.access_token) {
                                // Save new token
                                const updatedTokenData = {
                                    ...tokenData,
                                    access_token: newTokens.access_token,
                                    expires_at: Date.now() + (newTokens.expires_in || 3600) * 1000,
                                    refresh_token: newTokens.refresh_token || tokenData.refresh_token
                                };

                                await this.prisma.integrations.update({
                                    where: { id: integrationId },
                                    data: {
                                        encryptedBlob: this.encryption.encrypt(JSON.stringify(updatedTokenData))
                                    }
                                });

                                // Retry the API call
                                const data = await apiCall(newTokens.access_token);
                                return { data };
                            }
                        }
                    } catch (refreshError: any) {
                        console.error(`[TokenRefresh] Refresh failed:`, refreshError.message);
                    }
                }
            }

            return { data: null, error: error.message };
        }
    }
}
