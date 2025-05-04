// auth.ts
import { db } from "@/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { schema } from "@/db/schema";
import { resend } from "@/helpers/email/resend";
import { ForgotPasswordSchema } from "@/helpers/zod/forgot-password-schema";
import SignInSchema from "@/helpers/zod/login-schema";
import { PasswordSchema, SignupSchema } from "@/helpers/zod/signup-schema";
import { twoFactorSchema } from "@/helpers/zod/two-factor-schema";
import { betterAuth } from "better-auth";
import { magicLink, oneTap, twoFactor } from "better-auth/plugins";
import { validator, ZodAdapter } from "validation-better-auth";

export const auth = betterAuth({
  appName: "better_auth_nextjs",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password",
        html: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: user.email,
        subject: "Email Verification",
        html: `Click the link to verify your email: ${url}`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60 * 24,
  },
  plugins: [
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: user.email,
            subject: "Two Factor",
            html: `Your OTP is ${otp}`,
          });
        },
      },
      // skipVerificationOnEnable: true,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: email,
          subject: "Magic Link",
          html: `Click the link to login into your account: ${url}`,
        });
      },
    }),
    validator([
      { path: "/sign-up/email", adapter: ZodAdapter(SignupSchema) },
      { path: "/sign-in/email", adapter: ZodAdapter(SignInSchema) },
      { path: "/two-factor/enable", adapter: ZodAdapter(PasswordSchema) },
      { path: "/two-factor/disable", adapter: ZodAdapter(PasswordSchema) },
      { path: "/two-factor/verify-otp", adapter: ZodAdapter(twoFactorSchema) },
      { path: "/forgot-password", adapter: ZodAdapter(ForgotPasswordSchema) },
    ]),
    oneTap(),
  ],
});
