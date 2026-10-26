import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { App } from "@/components/App";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion");
  return <App userId={userId} />;
}
