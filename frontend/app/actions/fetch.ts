"use server";
import { prisma } from "@/lib/prisma";

export async function getPendingApplications() {
  try {
    const pendingApps = await prisma.universityApplication.findMany({
      where: { 
        status: "PENDING" 
      },
      // Explicitly select the fields, including the documents array
      select: {
        id: true,
        universityName: true,
        accreditationId: true,
        location: true,
        website: true,
        walletAddress: true,
        documents: true, // Now included
        createdAt: true,
      },
      orderBy: { 
        createdAt: "desc" 
      }
    });

    return { 
      success: true, 
      data: pendingApps 
    };
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    return { 
      success: false, 
      data: [], 
      error: "Could not fetch applications." 
    };
  }
}