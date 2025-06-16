import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";

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