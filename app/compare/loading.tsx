import { SkeletonCard } from "@/components/Skeleton";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function CompareLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <h1 className="px-1 text-xl font-bold text-brand-navy">
          Machine Match
        </h1>
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-44" />
        <SkeletonCard className="h-44" />
      </main>
      <BottomTabBar />
    </div>
  );
}
