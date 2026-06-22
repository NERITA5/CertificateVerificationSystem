// app/(admin)/dashboard/page.tsx
import { protectDashboard } from "@/lib/auth-guard";
import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Authenticate
  const session = await protectDashboard();

  if (!session) {
    redirect("/login");
  }

  try {
    // 2. Fetch stats 
    const stats = await getDashboardStats();

    // 3. Render the client component.
    // Ensure DashboardClient does not have 'mx-auto' or fixed widths 
    // that force it to the center of the page.
    return (
      <div className="w-full">
        <DashboardClient 
          stats={stats} 
          universityName={session.user} 
        />
      </div>
    );
    
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    
    console.error("Dashboard Page Error:", error);
    redirect("/login");
  }
}