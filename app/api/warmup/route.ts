import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Neon suspends the database after a few idle minutes; the first query then
// pays a multi-second wake-up. The root layout pings this route on app open
// so the wake happens while the user is still on the splash/home screen.
export async function GET() {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  await prisma.$queryRaw`SELECT 1`;
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
