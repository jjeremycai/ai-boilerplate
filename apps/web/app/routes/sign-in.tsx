import type { MetaFunction } from "@react-router/cloudflare";
import { SignInScreen } from "app/features/sign-in/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign In" },
  ];
};

export default function SignIn() {
  return <SignInScreen />;
}