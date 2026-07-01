"use server";

import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!,
});

export async function getPinataSignedUrl(cid: string) {
  try {
    // If .gateways is a function, call it directly with the URL or CID.
    // We try the modern method first, then the functional fallback.
    const signedUrl = await (pinata.gateways as any)(cid);
    
    return { success: true, url: signedUrl };
  } catch (error: any) {
    console.error("Pinata Signed URL Error:", error.message);
    return { success: false, error: "Failed to generate signed URL." };
  }
}

export async function getPinataUploadUrl(cid: string) {
  return await getPinataSignedUrl(cid);
}

export async function uploadToIPFS(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file provided." };
    
    const upload = await pinata.upload.file(file);
    const cid = (upload as any).IpfsHash || (upload as any).cid;
    
    return { success: true, ipfsHash: cid };
  } catch (error: any) {
    console.error("IPFS Upload Error:", error);
    return { success: false, error: error.message };
  }
}