import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { sessionStorage, getSession } from "./session.server";
import { prisma } from "./db.server";

export interface HostUser {
  id: string;
  provider: string;
  sub: string;
  email?: string;
  name?: string;
}

export const authenticator = new Authenticator<HostUser>(sessionStorage);

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.APP_URL) {
  console.warn(
    "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or APP_URL not set. Google OAuth will not work."
  );
} else {
  const googleStrategy = new OAuth2Strategy(
    {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      redirectURI: `${process.env.APP_URL}/auth/google/callback`,
      scopes: ["openid", "email", "profile"],
    },
    async ({ tokens }) => {
      // Get user info from Google
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const profile = await response.json();

      // Find or create host
      const host = await prisma.host.upsert({
        where: {
          provider_sub: {
            provider: "google",
            sub: profile.id,
          },
        },
        update: {
          email: profile.email,
          name: profile.name,
        },
        create: {
          provider: "google",
          sub: profile.id,
          email: profile.email,
          name: profile.name,
        },
      });

      return {
        id: host.id,
        provider: host.provider,
        sub: host.sub,
        email: host.email || undefined,
        name: host.name || undefined,
      };
    }
  );

  authenticator.use(googleStrategy, "google");
}

// Helper to get authenticated user from session
export async function getAuthenticatedUser(request: Request): Promise<HostUser | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get(authenticator.sessionKey) as HostUser | undefined;
  return user || null;
}
