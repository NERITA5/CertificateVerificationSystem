"use server";

/**
 * Uploads a file directly to Pinata using their REST API.
 * Bypasses pinata-web3 SDK which has serverless compatibility issues.
 */
export async function uploadToIPFS(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided in form data." };
    }

    if (!process.env.PINATA_JWT) {
      console.error("PINATA_JWT environment variable is not set.");
      return { success: false, error: "Server configuration error." };
    }

    const pinataFormData = new FormData();
    pinataFormData.append("file", file);
    pinataFormData.append(
      "pinataMetadata",
      JSON.stringify({ name: file.name })
    );
    pinataFormData.append(
      "pinataOptions",
      JSON.stringify({ cidVersion: 1 })
    );

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: pinataFormData,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pinata API error:", errText);
      throw new Error(`Pinata rejected the upload: ${errText}`);
    }

    const data = await response.json();
    const cid = data.IpfsHash;

    if (!cid) {
      throw new Error("Pinata returned no IPFS hash.");
    }

    return { success: true, ipfsHash: cid };

  } catch (error: any) {
    console.error("IPFS Upload Error:", error.message);
    return {
      success: false,
      error: error.message || "Unexpected error during IPFS upload.",
    };
  }
}

/**
 * Creates a signed gateway URL for an existing CID (used on verify page).
 */
export async function getPinataSignedUrl(cid: string) {
  try {
    if (!cid) return { success: false, error: "No CID provided." };

    const response = await fetch(
      `https://api.pinata.cloud/v3/files/private/download_link`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cid, expires: 120 }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create signed URL: ${errText}`);
    }

    const data = await response.json();
    return { success: true, url: data.url || data.data };

  } catch (error: any) {
    console.error("Pinata Signed URL Error:", error.message);
    return { success: false, error: "Failed to generate signed URL." };
  }
}