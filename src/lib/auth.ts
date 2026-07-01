import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        try {
          const { prisma } = await import("@/lib/prisma");
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
            role: user.role,
          };
        } catch (e) {
          console.error("Credentials authorize error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-ins, auto-create user — but ALWAYS return true
      // so a DB error doesn't block the login
      if (account?.provider === "google") {
        try {
          const { prisma } = await import("@/lib/prisma");
          const existing = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name ?? "",
                image: user.image ?? "",
                role: "USER",
              },
            });
          }
        } catch (e) {
          // Log but don't block — user can still sign in even if DB write fails
          console.error("Google signIn DB error:", e);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.provider === "credentials") {
          token.id = (user as { id: string; role: string }).id;
          token.role = (user as { id: string; role: string }).role;
        }
        if (account.provider === "google") {
          try {
            const { prisma } = await import("@/lib/prisma");
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
            } else {
              token.role = "USER";
            }
          } catch (e) {
            console.error("Google JWT DB error:", e);
            token.role = "USER";
          }
        }
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
