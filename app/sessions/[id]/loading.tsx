import { SkeletonCard } from "@/components/Skeleton";

export default function SessionDetailLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-6">
        <h1 className="px-1 text-xl font-bold text-brand-navy">Edit Session</h1>
        <SkeletonCard className="h-[132px]" />
        <SkeletonCard className="h-[84px]" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[68px]" />
          ))}
        </div>
      </main>
    </div>
  );
}
