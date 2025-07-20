"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import CardWrapper from "../card-wrapper";
import FormError from "../form-error";
import { FormSuccess } from "../form-success";

import { useAuthState } from "@/hooks/useAuthState";
import { signIn } from "@/lib/auth-client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

import SignInSchema from "@/helpers/zod/login-schema";
import { Mail, Mailbox } from "lucide-react";
import { requestOTP } from "@/helpers/auth/request-otp";

// Schemas tipados
const TraditionalSignInSchema = SignInSchema.options[0];
const MagicLinkSignInSchema = SignInSchema.options[1];

type TraditionalFormData = z.infer<typeof TraditionalSignInSchema>;
type MagicLinkFormData = z.infer<typeof MagicLinkSignInSchema>;

const SignIn = () => {
  const [signInMethod, setSignInMethod] = useState<"traditional" | "magicLink">(
    "traditional"
  );
  const router = useRouter();
  const {
    error,
    success,
    loading,
    setSuccess,
    setError,
    setLoading,
    resetState,
  } = useAuthState();

  const traditionalForm = useForm<TraditionalFormData>({
    resolver: zodResolver(TraditionalSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(MagicLinkSignInSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const onTraditionalSubmit = async (values: TraditionalFormData) => {
    resetState();
    setLoading(true);

    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);

      await signIn.email(
        {
          email: values.email,
          password: values.password,
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onSuccess: async (ctx) => {
            if (ctx.data.twoFactorRedirect) {
              const response = await requestOTP();
              if (response?.data) {
                setSuccess("OTP has been sent to your email");
                router.push("/two-factor");
              } else if (response?.error) {
                setError(response.error.message);
              }
            } else {
              setSuccess("Logged in successfully.");
              router.replace("/");
            }
          },
          onError: (ctx) => {
            setError(
              ctx.error.message ||
                `${
                  isEmail ? "Email" : "Username"
                } login failed. Please try again.`
            );
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onMagicLinkSubmit = async (values: MagicLinkFormData) => {
    resetState();
    setLoading(true);

    try {
      await signIn.magicLink(
        { email: values.email },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onSuccess: () => {
            setSuccess("A magic link has been sent to your email.");
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to send magic link.");
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSignInMethod = () => {
    resetState();
    setSignInMethod(
      signInMethod === "traditional" ? "magicLink" : "traditional"
    );
  };

  return (
    <CardWrapper
      cardTitle="Sign In"
      cardDescription="Enter your details below to login to your account"
      cardFooterDescription="Don't have an account?"
      cardFooterLink="/signup"
      cardFooterLinkTitle="Sign up"
    >
      {/* Renderização condicional com key para forçar remount */}
      <div key={signInMethod}>
        {signInMethod === "traditional" ? (
          <Form {...traditionalForm}>
            <form
              className="space-y-4"
              onSubmit={traditionalForm.handleSubmit(onTraditionalSubmit)}
            >
              <FormField
                control={traditionalForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={loading}
                        type="text"
                        placeholder="Enter email"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={traditionalForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={loading}
                        type="password"
                        placeholder="********"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                    <Link
                      href="/forgot-password"
                      className="text-xs underline ml-60"
                    >
                      Forgot Password?
                    </Link>
                  </FormItem>
                )}
              />

              <FormError message={error} />
              <FormSuccess message={success} />

              <Button disabled={loading} type="submit" className="w-full">
                Login
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...magicLinkForm}>
            <form
              className="space-y-4"
              onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
            >
              <FormField
                control={magicLinkForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={loading}
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormError message={error} />
              <FormSuccess message={success} />

              <Button disabled={loading} type="submit" className="w-full">
                Send Magic Link
              </Button>
            </form>
          </Form>
        )}

        <div className="flex justify-between mt-4">
          <Button type="button" className="w-20" onClick={toggleSignInMethod}>
            {signInMethod === "traditional" ? <Mailbox /> : <Mail />}
          </Button>
        </div>
      </div>
    </CardWrapper>
  );
};

export default SignIn;
