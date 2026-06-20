"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateUniversityStatusInDb(
  walletAddress: string, 
  status: string, 
  txHash: string
) {
  // Debug: Log incoming data to terminal
  console.log("Updating DB -> Wallet:", walletAddress, "Status:", status, "Hash:", txHash);

  if (!txHash) {
    console.error("Critical: No Transaction Hash provided!");
    return { success: false, error: "Transaction Hash is missing." };
  }

  try {
    const existing = await prisma.universityApplication.findUnique({
      where: { walletAddress: walletAddress }
    });

    if (!existing) {
      return { success: false, error: "University record not found." };
    }

    const updated = await prisma.universityApplication.update({
      where: { walletAddress: walletAddress },
      data: { 
        status: status, 
        transactionHash: txHash 
      }
    });

    // Refresh the admin dashboard cache
    revalidatePath('/dashboard/admin-control');

    return { success: true, data: updated };
  } catch (error) {
    console.error("Database update error:", error);
    return { success: false, error: "Failed to update database status." };
  }
}