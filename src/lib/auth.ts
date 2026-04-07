import type { NextAuthOptions } from "next-auth";
import StravaProvider from "next-auth/providers/strava";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read,activity:read_all",
          approval_prompt: "force",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const stravaId = String((profile as { id: number }).id);

        const user = await prisma.user.upsert({
          where: { stravaId },
          update: {
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            tokenExpiresAt: account.expires_at!,
          },
          create: {
            stravaId,
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            tokenExpiresAt: account.expires_at!,
          },
        });

        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId;
      return session;
    },
  },
};
