import { protectDashboard } from "@/lib/auth-guard";
import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  try {
    // 1. Authenticate and retrieve verified user details from the Guard
    const { user } = await protectDashboard();

    // 2. Fetch stats 
    // We removed the 'id' argument because getDashboardStats() 
    // now securely derives the identity internally from your cookies.
    const stats = await getDashboardStats();

    // 3. Render the client component with verified data
    return (
      <DashboardClient 
        stats={stats} 
        universityName={user} 
      />
    );
    
  } catch (error: any) {
    // Ensure Next.js redirects work correctly
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    
    console.error("Dashboard Page Error:", error);
    redirect("/login");
  }
}