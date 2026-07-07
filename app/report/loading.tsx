import { SkeletonCard } from "@/components/Skeleton";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function ReportLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6 pb-6">
        <SkeletonCard className="h-[38px]" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
        </div>
        <SkeletonCard className="h-[130px]" />
        <SkeletonCard className="h-[110px]" />
        <SkeletonCard className="h-[320px]" />
      </main>
      <BottomTabBar />
    </div>
  );
}
