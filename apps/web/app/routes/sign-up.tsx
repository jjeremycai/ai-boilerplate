import type { MetaFunction } from "@remix-run/cloudflare";
import { SignUpScreen } from "app/features/sign-up/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up" },
  ];
};

export default function SignUp() {
  return <SignUpScreen />;
}