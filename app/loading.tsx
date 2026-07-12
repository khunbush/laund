import { SkeletonCard } from "@/components/Skeleton";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
        <div className="mb-4 flex items-center justify-between px-1">
          <SkeletonCard className="h-7 w-36" />
          <SkeletonCard className="h-8 w-11 rounded-full" />
        </div>
        <div className="flex flex-col gap-5">
          <SkeletonCard className="h-[132px] rounded-3xl" />
          <SkeletonCard className="h-11 rounded-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[70px]" />
          ))}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
