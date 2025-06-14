import type { MetaFunction } from "@remix-run/node";
import { useSignIn, useUser } from "@workos-inc/authkit-react";
import { Navigate } from "@remix-run/react";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [
    { title: "Boilerplate App" },
    { name: "description", content: "Welcome to our app!" },
  ];
};

export default function Index() {
  const { user, isLoading } = useUser();
  const { signIn } = useSignIn();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
        <p className="text-gray-600 mb-6">Sign in to access the dashboard</p>
        <Button onClick={() => signIn()}>
          Sign In
        </Button>
      </div>
    </div>
  );
}