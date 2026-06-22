import { protectDashboard } from "@/lib/auth-guard";
import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Authenticate
  const session = await protectDashboard();

  // If the session is null, the guard has determined the user is unauthorized
  if (!session) {
    redirect("/login");
  }

  try {
    // 2. Fetch stats 
    // We assume getDashboardStats() is secure and uses the same session/cookie logic
    const stats = await getDashboardStats();

    // 3. Render the client component with verified data
    return (
      <DashboardClient 
        stats={stats} 
        universityName={session.user} 
      />
    );
    
  } catch (error: any) {
    // Ensure Next.js internal redirects (like those from getDashboardStats) aren't caught
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    
    console.error("Dashboard Page Error:", error);
    // On unexpected errors, force redirect to login
    redirect("/login");
  }
}