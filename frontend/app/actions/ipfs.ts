"use server";

import { PinataSDK } from "pinata-web3";

// Configure SDK with your credentials
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

/**
 * A helper to wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("TimeoutError")), ms)
    )
  ]);
}

export async function uploadToIPFS(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file was found in the submission payload." };
    }

    // Cast the UploadBuilder as a Promise to satisfy the withTimeout type check
   // The 'as unknown as' pattern is the standard TypeScript "escape hatch" 
// for converting incompatible types.
const upload = await withTimeout(pinata.upload.file(file) as unknown as Promise<any>, 30000);
    
    return { 
      success: true, 
      ipfsHash: upload.IpfsHash, 
    };
  } catch (error: any) {
    console.error("IPFS Upload Error Details:", error);
    
    return { 
      success: false, 
      error: error.message === "TimeoutError" 
        ? "Upload timed out. Check your internet connection." 
        : error.message || "Failed to reach IPFS gateway." 
    };
  }
}