import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  // Fetch the first record from the profile table
  const profile = await prisma.institutionProfile.findFirst();

  // Pass the DB result as the prop. 
  // If no record exists, it passes null, which your Client handles.
  return <ProfileClient initialData={profile} />;
}