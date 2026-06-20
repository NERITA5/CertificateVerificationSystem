'use server'

import { db } from "@/lib/db"; // Adjust to your actual db import
import { revalidatePath } from "next/cache";

export async function deletePendingCertificate(id: string) {
  try {
    await db.certificate.delete({
      where: { id: id },
    });
    revalidatePath("/dashboard/issue"); // Refresh the registry view
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete record" };
  }
}