import { SkeletonCard } from "@/components/Skeleton";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function SessionsLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
        <SkeletonCard className="mb-4 h-7 w-28" />
        <SkeletonCard className="mb-3 h-[68px]" />
        <SkeletonCard className="mb-3 h-8" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[76px]" />
          ))}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
