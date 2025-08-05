import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { KanbanBoard } from "./components/KanbanBoard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Content Creation Tracker</h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="flex-1 p-4 pb-0">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-[calc(100vh-6rem)] items-center justify-center">
      <div className="w-full flex justify-center">
        <Authenticated>
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {loggedInUser?.name || loggedInUser?.email || "friend"}!
            </h1>
            <p className="text-gray-600">
              Track your content creation ideas from concept to completion
            </p>
            <KanbanBoard />
          </div>
        </Authenticated>
        <Unauthenticated>
          <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Content Creation Tracker
              </h1>
              <p className="text-xl text-gray-600">
                Sign in to start tracking your content ideas
              </p>
            </div>
            <SignInForm />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}
