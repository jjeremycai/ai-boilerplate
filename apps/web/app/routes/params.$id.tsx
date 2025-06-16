import type { MetaFunction } from "@remix-run/cloudflare";
import { UserDetailScreen } from "app/features/user/detail-screen";

export const meta: MetaFunction = () => {
  return [
    { title: "User Detail" },
  ];
};

export default function UserDetail() {
  return <UserDetailScreen />;
}