"use server";
import { prisma } from "@/lib/prisma"; 

export async function getStudents(universityId: string) {
  try {
    return await prisma.student.findMany({
      where: { universityId },
      include: { 
        certificates: true // This automatically fetches all certificates linked to each student
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database query error:", error);
    return [];
  }
}