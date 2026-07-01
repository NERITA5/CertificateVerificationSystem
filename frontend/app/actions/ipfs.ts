"use server";

import { PinataSDK } from "pinata-web3";

// Initialize the SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!,
});

/**
 * Creates a signed URL for a CID. 
 * Using 'as any' to bypass incomplete SDK type definitions.
 */
export async function getPinataSignedUrl(cid: string) {
  try {
    const signedUrl = await (pinata.gateways as any).createSignedURL({
      cid: cid,
      expires: 120, // 2 minutes
    });

    return { success: true, url: signedUrl };
  } catch (error: any) {
    console.error("Pinata signed URL error:", error);
    return { success: false, error: error.message };
  }
}

// Compatibility helper
export async function getPinataUploadUrl(cid: string) {
  return await getPinataSignedUrl(cid);
}

/**
 * Uploads a file directly via Server Action.
 */
export async function uploadToIPFS(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file was found in the submission payload.",
      };
    }

    // Standard upload pattern for Pinata SDK
    const upload = await pinata.upload.file(file);

    // Casting to 'any' ensures the build succeeds by allowing access 
    // to the dynamic property name returned by the SDK response
    return {
      success: true,
      ipfsHash: (upload as any).IpfsHash || (upload as any).cid,
    };
  } catch (error: any) {
    console.error("IPFS Upload Error Details:", error);
    return {
      success: false,
      error: error.message || "Failed to reach IPFS gateway.",
    };
  }
}