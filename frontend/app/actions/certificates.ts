"use server";

import { prisma } from "../../lib/prisma"; 
import { cookies } from "next/headers";
import { verifyUniversityAccess } from "@/app/actions/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

async function getAuthContext() {
  const cookieStore = await cookies();
  const wallet = cookieStore.get('wallet_address')?.value;
  if (!wallet) throw new Error("Unauthorized");
  
  const auth = await verifyUniversityAccess(wallet);
  if (!auth.success || !auth.id) throw new Error("Unauthorized");
  
  return auth.id;
}

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
        universityId,
        isRevoked: false, 
      },
    });

    return { success: true, certificate: JSON.parse(JSON.stringify(newCertificate)) };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to save to database." };
  }
}

// ✅ Added optional finalIpfsHash parameter
// When the final PDF (with QR baked in) is uploaded, we update
// ipfsHash so the verify page always downloads the correct version.
export async function updateTransactionHash(
  id: string,
  txHash: string,
  qrCodeDataString: string,
  finalIpfsHash?: string // optional — updates ipfsHash if final PDF was re-uploaded
) {
  try {
    const universityId = await getAuthContext();
    
    const updatedCertificate = await prisma.certificate.update({
      where: { 
        id,
        universityId,
      },
      data: { 
        transactionHash: txHash,
        qrCodeData: qrCodeDataString,
        // Only update ipfsHash if a new final version was uploaded
        ...(finalIpfsHash && { ipfsHash: finalIpfsHash }),
      }
    });
    
    return { success: true, certificate: JSON.parse(JSON.stringify(updatedCertificate)) };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Unauthorized or failed to update." };
  }
}

export async function getAllCertificates() {
  try {
    const universityId = await getAuthContext();
    
    const certificates = await prisma.certificate.findMany({
      where: { universityId },
      orderBy: { createdAt: 'desc' },
    });
    
    return JSON.parse(JSON.stringify(certificates));
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }
}

export async function revokeCertificate(certId: string) {
  try {
    const universityId = await getAuthContext();

    await prisma.certificate.update({
      where: { 
        id: certId,
        universityId,
      },
      data: { 
        isRevoked: true 
      }
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/revoked-certificates');

    return { success: true };
  } catch (error) {
    console.error("Revocation Error:", error);
    return { success: false, error: "Unauthorized or failed to revoke." };
  }
}

export async function deletePendingCertificate(certId: string) {
  try {
    const universityId = await getAuthContext();

    await prisma.certificate.delete({
      where: { 
        id: certId,
        universityId,
        transactionHash: null,
      }
    });

    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Cannot delete: Certificate not found, already minted, or unauthorized." };
  }
}