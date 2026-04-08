import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activities = await prisma.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
    take: 15,
    select: {
      id: true,
      name: true,
      sportType: true,
      startDate: true,
      movingTime: true,
      distance: true,
      tss: true,
    },
  });

  return NextResponse.json(
    activities.map((a) => ({
      ...a,
      startDate: a.startDate.toISOString(),
    }))
  );
}
