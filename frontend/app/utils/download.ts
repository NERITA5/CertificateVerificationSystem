/**
 * Triggers a direct browser download for a certificate stored on Pinata IPFS.
 */
export const downloadCertificatePdf = async (ipfsHash: string, studentName: string) => {
  try {
    // Fallback to public gateway if env variable isn't fully propagated to the client side
    const gatewayBase = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud";
    const gatewayUrl = `${gatewayBase}/ipfs/${ipfsHash}`;
    
    const response = await fetch(gatewayUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    // Formats filename nicely (e.g., Certificate_radien.pdf)
    const formattedName = studentName.trim().replace(/\s+/g, '_');
    link.setAttribute('download', `Certificate_${formattedName}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up DOM objects
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("IPFS Download failed:", error);
    alert("Could not stream document file from Pinata storage gateway. Please try again.");
  }
};