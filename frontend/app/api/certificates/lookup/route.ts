import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Verified client tracker hook address

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return NextResponse.json({ success: false, error: "Missing hash parameter" }, { status: 400 });
    }

    // Explicitly query all structural metrics required by the frontend layout grid
    const certificate = await prisma.certificate.findUnique({
      where: { certHash: hash },
    });

    if (!certificate) {
      return NextResponse.json({ success: false, error: "Record footprint not found inside registry data rows" }, { status: 404 });
    }

    // Return the full certificate data object so properties map correctly to the client side
    return NextResponse.json({ 
      success: true, 
      certificate: {
        studentName: certificate.studentName,
        degree: certificate.degree,
        ipfsHash: certificate.ipfsHash || "",
        matricule: certificate.matricule || null,     // Gracefully falls back if entry row is blank
        department: certificate.department || null,   // Gracefully falls back if entry row is blank
        transactionHash: certificate.transactionHash || null
      }
    });
  } catch (error) {
    console.error("Internal API certificate lookup failure:", error);
    return NextResponse.json({ success: false, error: "Database execution error" }, { status: 500 });
  }
}