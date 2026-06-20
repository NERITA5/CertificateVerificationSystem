"use server";

import { prisma } from "../../lib/prisma"; 
import { cookies } from "next/headers";
import { verifyUniversityAccess } from "@/app/actions/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache"; // Add this line

/**
 * Helper to get verified university ID from session
 */
async function getAuthContext() {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;
  if (!wallet) throw new Error("Unauthorized");
  
  const auth = await verifyUniversityAccess(wallet);
  if (!auth.success || !auth.id) throw new Error("Unauthorized");
  
  return auth.id;
}

/**
 * Step 1: Create record linked to specific universityId
 */
export async function saveCertificateToDb(formData: {
  studentName: string;
  matricule: string;
  department: string;
  degree: string;
  ipfsHash: string;
}) {
  try {
    const universityId = await getAuthContext();
    
    const dataToHash = `${formData.matricule}-${formData.studentName}-${formData.degree}-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    const certHash = `0x${hash}`;

    const newCertificate = await prisma.certificate.create({
      data: {
        ...formData,
        certHash,
        universityId, // Bind to the authenticated university
        isRevoked: false, 
      },
    });

    return { success: true, certificate: JSON.parse(JSON.stringify(newCertificate)) };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to save to database." };
  }
}

/**
 * Step 2: Update record, ensuring the ID belongs to the university
 */
export async function updateTransactionHash(id: string, txHash: string, qrCodeDataString: string) {
  try {
    const universityId = await getAuthContext();
    
    const updatedCertificate = await prisma.certificate.update({
      where: { 
        id,
        universityId // Security check: Only update if it belongs to this university
      },
      data: { 
        transactionHash: txHash,
        qrCodeData: qrCodeDataString 
      }
    });
    
    return { success: true, certificate: JSON.parse(JSON.stringify(updatedCertificate)) };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Unauthorized or failed to update." };
  }
}

/**
 * Step 3: Fetch ONLY certificates belonging to the current university
 */
export async function getAllCertificates() {
  try {
    const universityId = await getAuthContext();
    
    const certificates = await prisma.certificate.findMany({
      where: { universityId }, // Scope results to the authenticated university
      orderBy: { createdAt: 'desc' },
    });
    
    return JSON.parse(JSON.stringify(certificates));
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }
}
/**
 * Step 4: Revoke a certificate, ensuring it belongs to the current university
 */
export async function revokeCertificate(certId: string) {
  try {
    const universityId = await getAuthContext();

    await prisma.certificate.update({
      where: { 
        id: certId,
        universityId // Security check: Only revoke if it belongs to this university
      },
      data: { 
        isRevoked: true 
      }
    });

    // Refresh the dashboard and revoked list so the UI updates immediately
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/revoked-certificates');

    return { success: true };
  } catch (error) {
    console.error("Revocation Error:", error);
    return { success: false, error: "Unauthorized or failed to revoke." };
  }
}
/**
 * Step 5: Delete a pending certificate
 * Ensures only pending (un-minted) certificates belonging to this university are deleted.
 */
export async function deletePendingCertificate(certId: string) {
  try {
    const universityId = await getAuthContext();

    // Security check: Only find and delete if it belongs to this university
    // AND it has no transactionHash (meaning it's still pending)
    const deletedCertificate = await prisma.certificate.delete({
      where: { 
        id: certId,
        universityId,
        transactionHash: null // Ensure we only delete if not yet minted
      }
    });

    // Refresh the dashboard so the UI updates
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Cannot delete: Certificate not found, already minted, or unauthorized." };
  }
}