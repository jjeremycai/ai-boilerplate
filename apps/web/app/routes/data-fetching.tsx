import type { MetaFunction } from "@remix-run/cloudflare";
import { DataFetchingScreen } from "app/features/data-fetching/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Data Fetching" },
  ];
};

export default function DataFetching() {
  return <DataFetchingScreen />;
}