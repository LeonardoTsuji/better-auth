// src/lib/auth-client.ts
import { twoFactorClient } from "better-auth/plugins";
import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [twoFactorClient(), magicLinkClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
