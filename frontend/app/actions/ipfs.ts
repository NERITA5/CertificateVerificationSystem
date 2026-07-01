"use server";

export async function getPinataUploadCredentials() {
  if (!process.env.PINATA_JWT) {
    return { success: false, error: "Pinata JWT not configured.", JWT: null };
  }
  try {
    const response = await fetch(
      "https://api.pinata.cloud/users/generateApiKey",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyName: `temp_upload_${Date.now()}`,
          maxUses: 2,
          permissions: {
            endpoints: {
              pinning: { pinFileToIPFS: true },
            },
          },
        }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }
    const data = await response.json();
    return { success: true, JWT: data.JWT };
  } catch (error: any) {
    console.error("Pinata key gen error:", error.message);
    return { success: false, error: error.message, JWT: null };
  }
}

export async function getPinataSignedUrl(cid: string) {
  try {
    if (!cid) return { success: false, error: "No CID provided.", url: null };
    const response = await fetch(
      "https://api.pinata.cloud/v3/files/private/download_link",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cid, expires: 120 }),
      }
    );
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return { success: true, url: data.url || data.data };
  } catch (error: any) {
    console.error("Pinata Signed URL Error:", error.message);
    return { success: false, error: "Failed to generate signed URL.", url: null };
  }
}