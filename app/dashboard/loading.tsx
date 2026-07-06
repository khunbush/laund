import { SkeletonCard } from "@/components/Skeleton";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <h1 className="px-1 text-xl font-bold text-brand-navy">Dashboard</h1>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
        </div>
        <SkeletonCard className="h-[120px]" />
        <SkeletonCard className="h-[290px]" />
        <SkeletonCard className="h-[330px]" />
      </main>
      <BottomTabBar />
    </div>
  );
}
