import type { MetaFunction } from "@react-router/cloudflare";
import { VirtualizedListScreen } from "app/features/virtualized-list/screen";

export const meta: MetaFunction = () => {
  return [
    { title: "Virtualized List" },
  ];
};

export default function VirtualizedList() {
  return <VirtualizedListScreen />;
}