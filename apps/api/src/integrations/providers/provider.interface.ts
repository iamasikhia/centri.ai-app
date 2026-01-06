export interface SyncResult {
    meetings?: any[];
    tasks?: any[];
    teamMembers?: any[];
    emails?: any[];
    customData?: any;
}

export interface IProvider {
    name: string;
    getAuthUrl(redirectUri: string): string;
    exchangeCode(code: string, redirectUri: string): Promise<any>; // Returns tokens
    refreshTokens?(refreshToken: string): Promise<any>;
    syncData(userId: string, tokens: any): Promise<SyncResult>;
}
