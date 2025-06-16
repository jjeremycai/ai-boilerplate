import type { MetaFunction } from "@react-router/cloudflare";
import { UpdatePasswordScreen } from "app/features/password-reset/update-password/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Update Password" },
  ];
};

export default function UpdatePassword() {
  return <UpdatePasswordScreen />;
}