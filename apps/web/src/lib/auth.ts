
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;

                // Sync to backend (Fire and forget, or await)
                try {
                    // Assuming hardcoded user ID for MVP same as backend
                    await fetch('http://localhost:3001/integrations/google/save-tokens', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': 'default-user-id'
                        },
                        body: JSON.stringify({
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            scope: account.scope,
                            token_type: account.token_type,
                            id_token: account.id_token
                        })
                    });
                    console.log("Synced Google tokens to backend");
                } catch (e) {
                    console.error("Failed to sync tokens to backend", e);
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken;
            return session;
        },
    },
    pages: {
        signIn: '/',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
