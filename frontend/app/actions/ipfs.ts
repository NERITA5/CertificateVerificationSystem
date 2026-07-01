"use server";

import { PinataSDK } from "pinata-web3";

// Initialize the SDK using environment variables
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!,
});

/**
 * Creates a signed URL for an existing CID.
 */
export async function getPinataSignedUrl(cid: string) {
  try {
    // We use (pinata.gateways as any) to bypass strict type definition issues
    // that occur in some versions of the SDK.
    const signedUrl = await (pinata.gateways as any).createSignedURL({
      cid: cid,
      expires: 120, // 2 minutes
    });

    return { success: true, url: signedUrl };
  } catch (error: any) {
    console.error("Pinata Signed URL Error:", error.message);
    return { success: false, error: "Failed to generate signed URL." };
  }
}

// Compatibility helper
export async function getPinataUploadUrl(cid: string) {
  return await getPinataSignedUrl(cid);
}

/**
 * Uploads a file directly to IPFS.
 */
export async function uploadToIPFS(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    
    if (!file) {
      return { success: false, error: "No file provided in form data." };
    }

    // Perform the upload
    const upload = await pinata.upload.file(file);

    // Pinata SDK responses can vary; checking for standard property names
    const cid = (upload as any).IpfsHash || (upload as any).cid;

    if (!cid) {
      throw new Error("Upload successful, but CID was not returned by Pinata.");
    }

    return { success: true, ipfsHash: cid };
  } catch (error: any) {
    console.error("IPFS Upload Error Details:", error);
    return { 
      success: false, 
      error: error.message || "An unexpected error occurred during IPFS upload." 
    };
  }
}