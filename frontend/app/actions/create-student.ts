"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStudent(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const matricule = formData.get("matricule") as string;
    const department = formData.get("department") as string;
    const faculty = formData.get("faculty") as string;
    const universityId = formData.get("universityId") as string;
    const skipDuplicateCheck = formData.get("skipDuplicateCheck") === "true";

    if (!name || !matricule) {
      return { success: false, error: "Name and matricule are required." };
    }

    // Check if student with this matricule already exists
    const existing = await prisma.student.findFirst({
      where: { matricule },
    });

    if (existing) {
      if (skipDuplicateCheck) {
        // Called from certificate issuance — silently return existing student
        return { success: true, student: existing };
      } else {
        // Called from manual Add Student form — block with clear error
        return {
          success: false,
          error: `A student with matricule "${matricule}" already exists.`,
        };
      }
    }

    const student = await prisma.student.create({
      data: {
        name,
        email: email || "",
        matricule,
        department: department || "",
        faculty: faculty || "",
        universityId: universityId || "",
      },
    });

    revalidatePath("/dashboard/students");
    return { success: true, student };

  } catch (error: any) {
    console.error("Create student error:", error);
    return { success: false, error: "Failed to create student." };
  }
}