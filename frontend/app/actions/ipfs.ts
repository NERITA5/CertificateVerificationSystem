"use server";

import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!,
});

/**
 * Creates a signed gateway URL for an existing CID (used on verify page).
 */
export async function getPinataSignedUrl(cid: string) {
  try {
    const signedUrl = await (pinata.gateways as any).createSignedURL({
      cid,
      expires: 120,
    });
    return { success: true, url: signedUrl };
  } catch (error: any) {
    console.error("Pinata Signed URL Error:", error.message);
    return { success: false, error: "Failed to generate signed URL." };
  }
}

/**
 * Uploads a file to IPFS via the server action (no Vercel size issue at scale 2).
 */
export async function uploadToIPFS(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided in form data." };
    }

    const upload = await pinata.upload.file(file);
    const cid = (upload as any).IpfsHash || (upload as any).cid;

    if (!cid) {
      throw new Error("Upload successful, but CID was not returned by Pinata.");
    }

    return { success: true, ipfsHash: cid };
  } catch (error: any) {
    console.error("IPFS Upload Error Details:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during IPFS upload.",
    };
  }
}