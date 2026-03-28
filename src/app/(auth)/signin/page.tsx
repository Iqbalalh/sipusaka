import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SIPUSAKA - Sign In",
  description: "Masuk ke akun SIPUSAKA Anda",
};

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
