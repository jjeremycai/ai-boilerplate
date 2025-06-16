import type { MetaFunction } from "@remix-run/cloudflare";
import { HomeScreen } from "app/features/home/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Home" },
  ];
};

export default function Index() {
  return <HomeScreen />;
}