import { SkeletonCard } from "@/components/Skeleton";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function BranchesLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <div className="flex items-center justify-between px-1">
          <SkeletonCard className="h-8 w-10" />
          <SkeletonCard className="h-6 w-32" />
          <SkeletonCard className="h-8 w-10" />
        </div>
        <SkeletonCard className="h-9" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </main>
      <BottomTabBar />
    </div>
  );
}
