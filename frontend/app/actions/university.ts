"use server";
import { prisma } from "@/lib/prisma";

export async function submitApplication(data: {
  universityName: string;
  accreditationId: string;
  walletAddress: string;
  location: string;
  website: string;
  documents: string[];
}) {
  try {
    // We explicitly map the data to ensure it matches the Prisma schema fields
    await prisma.universityApplication.create({
      data: {
        universityName: data.universityName,
        accreditationId: data.accreditationId,
        walletAddress: data.walletAddress,
        location: data.location,
        website: data.website,
        documents: data.documents,
        status: "PENDING",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Submission error:", error);
    return { 
      success: false, 
      error: "Submission failed. Ensure the wallet address is unique and all fields are filled." 
    };
  }
}