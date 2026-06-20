"use server";

import { prisma } from "@/lib/prisma"; // Adjust this path to match your actual Prisma client instance location

export async function getIpfsHashByCertHash(certHash: string) {
  try {
    const record = await prisma.certificate.findUnique({
      where: { certHash }
    });

    if (!record) return { success: false, error: "No local matching record found for this certificate footprint." };

    return { 
      success: true, 
      // Ensure this property matches the exact field name in your Prisma Schema (e.g., ipfsHash or dataHash)
      ipfsHash: record.ipfsHash 
    };
  } catch (error) {
    console.error("Database Lookup Error:", error);
    return { success: false, error: "Database reading failure." };
  }
}