"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStudent(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  console.log("Incoming Form Data:", rawData); // Check your terminal!

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const matricule = formData.get("matricule") as string;
  const department = formData.get("department") as string;
  const faculty = formData.get("faculty") as string;
  const universityId = formData.get("universityId") as string;

  // Validation: If universityId is missing, it will hit this block
  if (!name || !email || !matricule || !department || !faculty || !universityId || universityId === "undefined" || universityId === "") {
    console.error("Validation Error: Missing field. universityId received:", universityId);
    return { success: false, error: `Missing required fields (ID: ${universityId || "EMPTY"})` };
  }

  try {
    const student = await prisma.student.create({
      data: {
        name,
        email,
        matricule,
        department,
        faculty,
        universityId,
      },
    });
    
    revalidatePath("/dashboard/students"); 
    return { success: true, student };
  } catch (error: any) {
    console.error("Database Error:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A student with this Matricule ID already exists." };
    }
    return { success: false, error: "Could not create student. Please try again." };
  }
}