import type { LoaderFunctionArgs, MetaFunction } from "@react-router/cloudflare";
import { useLoaderData } from "react-router";
import { json } from "@react-router/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Server-side rendering" },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  return json({ content: 'This content is sent from the server' });
}

export default function SSR() {
  const { content } = useLoaderData<typeof loader>();
  
  return (
    <div className="flex flex-col flex-1 p-4">
      <h1 className="text-xl font-bold mb-4">Server-side rendering</h1>
      <p>{content}</p>
    </div>
  );
}