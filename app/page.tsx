import { NewSessionForm } from "@/components/NewSessionForm";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
        <h1 className="mb-4 px-1 text-xl font-bold text-brand-navy">
          New Session
        </h1>
        <NewSessionForm />
      </main>
      <BottomTabBar />
    </div>
  );
}
