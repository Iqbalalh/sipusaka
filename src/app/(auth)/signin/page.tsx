import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIPUSAKA - Sign In",
  description: "Masuk ke akun SIPUSAKA Anda",
};

export default function SignIn() {
  return <SignInForm />;
}
