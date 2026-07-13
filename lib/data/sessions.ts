import "server-only";
import { prisma } from "@/lib/db";

export async function listSessions({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const [sessions, total] = await Promise.all([
    prisma.collectionSession.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.collectionSession.count(),
  ]);

  return { sessions, total };
}

export async function getSessionById(id: string) {
  return prisma.collectionSession.findUnique({ where: { id } });
}

/** The n most recent sessions, newest first. */
export async function getRecentSessions(n: number) {
  return prisma.collectionSession.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: n,
  });
}
