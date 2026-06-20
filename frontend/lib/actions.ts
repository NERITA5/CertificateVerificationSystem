"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDatabaseRevocation(ipfsHash: string) {
  try {
    // Change .update to .updateMany because ipfsHash is not a unique index
    const result = await prisma.certificate.updateMany({
      where: { 
        ipfsHash: ipfsHash 
      },
      data: { 
        isRevoked: true 
      },
    });

    if (result.count === 0) {
      console.error("No certificate found with that ipfsHash.");
      return { success: false, error: "Not found" };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Database sync failed:", error);
    return { success: false, error: "Database update failed" };
  }
}