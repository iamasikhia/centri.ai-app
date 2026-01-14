import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@centri.ai" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('[Auth] Missing credentials');
                    return null;
                }

                console.log('[Auth] Attempting login for:', credentials.email);

                // For development: hardcoded admin credentials
                const ADMIN_EMAIL = "admin@centri.ai";
                const ADMIN_PASSWORD = "admin123";

                if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
                    console.log('[Auth] Login successful for admin');
                    return {
                        id: "admin-user",
                        email: ADMIN_EMAIL,
                        name: "Admin User",
                        role: "admin"
                    };
                }

                console.log('[Auth] Invalid credentials');
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = (user as any).role || 'admin';
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token.admin`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
