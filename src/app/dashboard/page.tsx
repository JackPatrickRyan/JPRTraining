import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }
  return <DashboardContent />;
}
