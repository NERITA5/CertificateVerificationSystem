"use server";
import { prisma } from "@/lib/prisma"; // Adjust your import path

export async function updateDatabaseRevocation(ipfsHash: string) {
  try {
    await prisma.certificate.update({
      where: { ipfsHash: ipfsHash },
      data: { isRevoked: true },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database update failed" };
  }
}