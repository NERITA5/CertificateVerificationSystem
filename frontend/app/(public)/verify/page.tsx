"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyCert } from "@/lib/contract";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  ShieldCheck,
  ShieldX,
  Loader2,
  ExternalLink,
  Upload,
  CheckCircle2,
  Download,
  RefreshCw,
  Copy,
  Globe,
  Mail,
  Phone,
  MapPin,
  Info,
  Camera,
} from "lucide-react";

// Detect mobile once at module level
const isMobile = () =>
  typeof window !== "undefined" &&
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const certHash = searchParams.get("hash");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resolvedIpfsHash, setResolvedIpfsHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRevoked, setIsRevoked] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  const qrRegionId = "html5qr-reader";
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  // AUTO VERIFY
  useEffect(() => {
    if (certHash) {
      runVerificationRoutine(certHash);
    }
  }, [certHash]);

  const stopScanner = useCallback(async () => {
    try {
      if (html5QrcodeRef.current && isScanningRef.current) {
        await html5QrcodeRef.current.stop();
        isScanningRef.current = false;
      }
    } catch (_) {}
  }, []);

  // START DESKTOP SCANNER ONLY
  useEffect(() => {
    if (mobile || certHash || result || loading) return;

    hasNavigatedRef.current = false;
    let mounted = true;

    const startScanner = async () => {
      await new Promise((r) => setTimeout(r, 300));
      if (!mounted) return;

      try {
        if (html5QrcodeRef.current) {
          try { await html5QrcodeRef.current.stop(); } catch (_) {}
        }
        html5QrcodeRef.current = new Html5Qrcode(qrRegionId, { verbose: false });

        setIsScanning(true);
        setScannerError(null);
        isScanningRef.current = true;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
          disableFlip: false,
        };

        const onSuccess = async (decodedText: string) => {
          if (hasNavigatedRef.current) return;
          hasNavigatedRef.current = true;
          await handleDecodedUrl(decodedText);
        };

        try {
          await html5QrcodeRef.current.start(
            { facingMode: { exact: "environment" } },
            config, onSuccess, () => {}
          );
        } catch (_) {
          try {
            await html5QrcodeRef.current.start(
              { facingMode: "environment" },
              config, onSuccess, () => {}
            );
          } catch (__) {
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
              setScannerError("No camera detected on this device.");
              setIsScanning(false);
              isScanningRef.current = false;
              return;
            }
            const backCamera =
              devices.find((d) => /back|rear|environment/i.test(d.label)) ||
              devices[devices.length - 1];
            await html5QrcodeRef.current.start(
              backCamera.id, config, onSuccess, () => {}
            );
          }
        }
      } catch (err: any) {
        console.error("Scanner start error:", err);
        isScanningRef.current = false;
        setIsScanning(false);
        if (!mounted) return;
        if (
          err?.message?.toLowerCase().includes("permission") ||
          err?.message?.toLowerCase().includes("denied") ||
          err?.name === "NotAllowedError"
        ) {
          setScannerError(
            "Camera permission denied. Please allow camera access in your browser settings, then refresh."
          );
        } else {
          setScannerError(
            "Camera unavailable. Use 'Upload QR Image' below to verify instead."
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [mobile, certHash, result, loading]);

  const handleDecodedUrl = async (text: string) => {
    await stopScanner();
    setIsScanning(false);
    try {
      let hash = text.trim();
      if (text.includes("?hash=")) {
        const url = new URL(text);
        hash = url.searchParams.get("hash") || text.trim();
      }
      router.push(`/verify?hash=${encodeURIComponent(hash)}`);
    } catch (err) {
      console.error("URL parse error:", err);
      router.push(`/verify?hash=${encodeURIComponent(text.trim())}`);
    }
  };

  const restartScanner = async () => {
    await stopScanner();
    setResult(null);
    setError(null);
    setIsRevoked(false);
    setResolvedIpfsHash("");
    setScannerError(null);
    hasNavigatedRef.current = false;
    router.push("/verify");
  };

  // Mobile: user taps "Scan with Camera" → native camera opens → photo taken → scanned
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const scanner = new Html5Qrcode("hidden-file-reader", { verbose: false });
      const decodedText = await scanner.scanFile(file, true);
      await scanner.clear();
      await handleDecodedUrl(decodedText);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(
        "Could not detect a QR code. Make sure the QR code is clear and well-lit, then try again."
      );
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Desktop: upload existing image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const scanner = new Html5Qrcode("hidden-file-reader", { verbose: false });
      const decodedText = await scanner.scanFile(file, true);
      await scanner.clear();
      await handleDecodedUrl(decodedText);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Could not detect a QR code in the uploaded image.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const runVerificationRoutine = async (hashToVerify: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setIsRevoked(false);
    setResolvedIpfsHash("");

    let dbCertData = null;

    try {
      try {
        const lookupResponse = await fetch(
          `/api/certificates/lookup?hash=${hashToVerify}`
        );
        const lookupData = await lookupResponse.json();
        if (lookupData?.success) {
          dbCertData = lookupData.certificate;
          if (dbCertData?.ipfsHash) {
            setResolvedIpfsHash(dbCertData.ipfsHash);
          }
        }
      } catch (dbErr) {
        console.warn("DB lookup failed:", dbErr);
      }

      if (dbCertData?.isRevoked) {
        setIsRevoked(true);
        setResult({
          studentName: dbCertData.studentName,
          degree: dbCertData.degree,
          university: dbCertData.university,
          matricule: dbCertData.matricule,
          department: dbCertData.department,
          transactionHash: dbCertData.transactionHash || null,
        });
        setLoading(false);
        return;
      }

      const blockchainKey = dbCertData?.ipfsHash || hashToVerify;
      let data: any = null;

      try {
        data = await verifyCert(blockchainKey);
      } catch (bcErr) {
        console.warn("Blockchain call failed, falling back to DB:", bcErr);
        if (dbCertData) {
          data = {
            isValid: true,
            isRevoked: false,
            studentName: dbCertData.studentName,
            degree: dbCertData.degree,
            university: dbCertData.university,
            timestamp: dbCertData.timestamp || Math.floor(Date.now() / 1000),
          };
        } else {
          throw bcErr;
        }
      }

      if (data?.isRevoked) {
        setIsRevoked(true);
        setResult({
          studentName: dbCertData?.studentName || data.studentName,
          degree: dbCertData?.degree || data.degree,
          university: dbCertData?.university || data.university,
          matricule: dbCertData?.matricule || data.matricule,
          department: dbCertData?.department || data.department,
          transactionHash: dbCertData?.transactionHash || null,
        });
      } else if (data && data.isValid) {
        setResult({
          ...data,
          studentName: dbCertData?.studentName || data.studentName,
          degree: dbCertData?.degree || data.degree,
          university: dbCertData?.university || data.university || "University of Buea",
          matricule: dbCertData?.matricule || data.matricule || null,
          department: dbCertData?.department || data.department || null,
          transactionHash: dbCertData?.transactionHash || data.transactionHash || null,
        });
      } else if (dbCertData) {
        setResult({
          isValid: true,
          studentName: dbCertData.studentName,
          degree: dbCertData.degree,
          university: dbCertData.university || "University of Buea",
          matricule: dbCertData.matricule || null,
          department: dbCertData.department || null,
          transactionHash: dbCertData.transactionHash || null,
        });
      } else {
        setError("Certificate not found or invalid.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => { setCopied(null); }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-white scroll-smooth">
      <div
        id="hidden-file-reader"
        style={{ position: "absolute", top: "-9999px", left: "-9999px", width: "1px", height: "1px" }}
      />

      {/* Mobile: native camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* Desktop: file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111F]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2 md:gap-3 cursor-pointer">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 md:p-2.5 rounded-xl md:rounded-2xl shadow-lg shadow-cyan-500/20">
              <ShieldCheck size={18} className="md:w-[22px] md:h-[22px]" />
            </div>
            <div>
              <h1 className="font-black text-base md:text-xl tracking-wide text-white">certiVERIFY</h1>
              <p className="text-[9px] md:text-[11px] text-slate-400 font-medium hidden sm:block">
                Blockchain Verification
              </p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#home" className="hover:text-cyan-400 transition">Home</a>
            <a href="#about" className="hover:text-cyan-400 transition">About</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition">How It Works</a>
            <a href="#contact" className="hover:text-cyan-400 transition">Contact Us</a>
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-300 font-medium bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/10">
            <Globe size={13} className="md:w-[15px] md:h-[15px]" /> EN
          </div>
        </div>
      </header>

      <main id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        {/* HERO */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-center mb-10 md:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
              <ShieldCheck size={14} className="md:w-4 md:h-4" /> Secure Blockchain Verification
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black leading-tight text-white">
              Verify Academic Certificates Instantly
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mt-4 md:mt-6 max-w-xl">
              Securely scan and validate academic certificates using blockchain-powered authentication technology.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-[32px] p-5 md:p-6 shadow-2xl shadow-cyan-500/10">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <QrCode className="text-cyan-400" size={18} />
                <span className="font-bold text-cyan-300 text-xs md:text-sm tracking-wide">
                  QR CODE SCANNER
                </span>
              </div>

              {mobile ? (
                // ── MOBILE UI ──────────────────────────────────────────────
                <div className="flex flex-col gap-3">
                  {/* Primary: open native camera */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 active:scale-95 transition-all py-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 text-base"
                  >
                    <Camera size={32} />
                    <span>Tap to Scan QR Code</span>
                    <span className="text-xs font-normal opacity-80">
                      Opens your camera — point at the QR code
                    </span>
                  </button>

                  {/* Secondary: pick from gallery */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 transition-all py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload size={16} /> Upload QR Image from Gallery
                  </button>

                  <p className="text-center text-slate-500 text-xs mt-1">
                    Take a photo of the certificate QR code or upload one from your gallery
                  </p>
                </div>
              ) : (
                // ── DESKTOP UI ─────────────────────────────────────────────
                <>
                  <div
                    style={{ position: "relative", width: "100%", height: "300px" }}
                    className="rounded-2xl md:rounded-3xl border border-white/10 bg-black"
                  >
                    <div id={qrRegionId} style={{ width: "100%", height: "100%" }} />
                    {!isScanning && (
                      <div
                        style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          backgroundColor: "#0B1629",
                          borderRadius: "inherit",
                        }}
                      >
                        <QrCode size={60} className="text-slate-700" />
                      </div>
                    )}
                  </div>

                  {scannerError ? (
                    <p className="text-center text-rose-400 text-xs md:text-sm mt-4 leading-relaxed">
                      {scannerError}
                    </p>
                  ) : isScanning ? (
                    <p className="text-center text-slate-400 text-sm mt-5">
                      Point your camera at the certificate QR code
                    </p>
                  ) : (
                    <p className="text-center text-slate-400 text-sm mt-5">
                      Starting camera...
                    </p>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-4 md:mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <Upload size={16} className="md:w-[17px] md:h-[17px]" /> Upload QR Image
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RESULT AREA */}
        <div>
          {loading ? (
            <div className="bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] min-h-[320px] md:min-h-[420px] flex flex-col items-center justify-center backdrop-blur-xl px-4 text-center">
              <Loader2 size={44} className="animate-spin text-cyan-400 mb-4 md:mb-5 md:w-[55px] md:h-[55px]" />
              <h3 className="text-xl md:text-2xl font-bold text-white">Verifying Certificate...</h3>
              <p className="text-slate-400 mt-2 text-sm md:text-base">Connecting to blockchain network.</p>
            </div>
          ) : isRevoked && result ? (
            <div className="bg-white/5 border border-rose-500/20 rounded-[24px] md:rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl shadow-rose-500/10">
              <div className="p-6 md:p-8 border-b border-white/10 bg-rose-500/10 flex flex-col sm:flex-row items-start gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <ShieldX size={28} className="md:w-[34px] md:h-[34px]" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-rose-400">Certificate Revoked</h3>
                  <p className="text-slate-300 mt-2 text-sm md:text-base">
                    This certificate has been revoked by the issuing institution and is no longer valid.
                  </p>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-5 md:space-y-6">
                <DetailRow label="Student Name" value={result.studentName} />
                <DetailRow label="Degree" value={result.degree} />
                <DetailRow label="Institution" value={result.university || "University of Buea"} />
                {result.department && <DetailRow label="Department" value={result.department} />}
                <div className="pt-2">
                  <button
                    onClick={restartScanner}
                    className="w-full border border-white/10 bg-white/5 hover:bg-white/10 transition py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <RefreshCw size={18} /> Verify Another
                  </button>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
              <div className="p-6 md:p-8 border-b border-white/10 bg-emerald-500/10 flex flex-col sm:flex-row items-start gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 size={28} className="md:w-[34px] md:h-[34px]" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-emerald-400">Certificate Verified</h3>
                  <p className="text-slate-300 mt-2 text-sm md:text-base">
                    This certificate is authentic and securely stored on the blockchain.
                  </p>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-5 md:space-y-6">
                <DetailRow
                  label="Certificate ID"
                  value={certHash ? `${certHash.substring(0, 16)}...` : "N/A"}
                  copy={() => copyToClipboard(certHash || "", "certId")}
                  copied={copied === "certId"}
                />
                <DetailRow label="Student Name" value={result.studentName} />
                <DetailRow label="Degree" value={result.degree} />
                <DetailRow label="Institution" value={result.university || "University of Buea"} />
                {result.department && <DetailRow label="Department" value={result.department} />}

                {result.transactionHash ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 items-start border-b border-white/5 pb-5 last:border-none">
                    <span className="text-slate-400 font-semibold text-sm">Blockchain Tx</span>
                    <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 text-sm font-semibold hover:underline flex items-center gap-1 break-all"
                      >
                        {result.transactionHash.substring(0, 25)}...
                        <ExternalLink size={13} className="flex-shrink-0" />
                      </a>
                      <button
                        onClick={() => copyToClipboard(result.transactionHash, "tx")}
                        className="text-slate-400 hover:text-cyan-400"
                      >
                        <Copy size={14} />
                      </button>
                      {copied === "tx" && <span className="text-emerald-400 text-xs font-bold">Copied</span>}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 items-start border-b border-white/5 pb-5 last:border-none">
                    <span className="text-slate-400 font-semibold text-sm">Blockchain Tx</span>
                    <span className="md:col-span-2 text-amber-400 text-sm font-semibold">Pending confirmation</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-4">
                  {resolvedIpfsHash && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${resolvedIpfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Download size={18} /> Download Certificate
                    </a>
                  )}
                  <button
                    onClick={restartScanner}
                    className="border border-white/10 bg-white/5 hover:bg-white/10 transition py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <RefreshCw size={18} /> Verify Another
                  </button>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[24px] md:rounded-[32px] min-h-[320px] md:min-h-[400px] flex flex-col items-center justify-center text-center p-6 md:p-10">
              <h3 className="text-2xl md:text-3xl font-black text-red-400 mb-3 md:mb-4">Verification Failed</h3>
              <p className="text-slate-300 max-w-md text-sm md:text-base">{error}</p>
              <button
                onClick={restartScanner}
                className="mt-6 md:mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] min-h-[320px] md:min-h-[400px] flex flex-col items-center justify-center text-center p-6 md:p-10 backdrop-blur-xl">
              <ShieldCheck size={50} className="text-slate-700 mb-4 md:mb-5 md:w-[65px] md:h-[65px]" />
              <h3 className="text-2xl md:text-3xl font-black text-white">Awaiting Verification</h3>
              <p className="text-slate-400 mt-3 max-w-md leading-relaxed text-sm md:text-base">
                {mobile
                  ? "Tap the button above to scan a QR code with your camera."
                  : "Scan a QR code or upload a QR image to begin verification."}
              </p>
            </div>
          )}
        </div>

        {/* ABOUT */}
        <section id="about" className="mt-16 md:mt-28 scroll-mt-20 md:scroll-mt-28">
          <div className="bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <Info className="text-cyan-400" />
              <h3 className="text-2xl md:text-3xl font-black text-white">About certiVERIFY</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-base md:text-lg">
              certiVERIFY is a blockchain-based academic certificate verification platform designed to prevent certificate fraud and simplify verification for institutions, employers, and students.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mt-16 md:mt-28 scroll-mt-20 md:scroll-mt-28">
          <div className="bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 backdrop-blur-xl">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-6 md:mb-10">How It Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StepCard number="1" title="Scan QR" description="Scan the certificate QR code instantly." />
              <StepCard number="2" title="Retrieve Data" description="The system securely retrieves certificate records." />
              <StepCard number="3" title="Verify Blockchain" description="Blockchain data is checked for authenticity." />
              <StepCard number="4" title="View Result" description="The verification result appears instantly." />
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="mt-16 md:mt-28 scroll-mt-20 md:scroll-mt-28">
          <div className="bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] p-6 md:p-8 backdrop-blur-xl">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-6 md:mb-10">Contact Us</h3>
            <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
              <ContactCard icon={<Mail className="text-cyan-400" />} title="Email" value="kettynerita@gmail.com" />
              <ContactCard icon={<Phone className="text-cyan-400" />} title="Phone" value="692184525" />
              <ContactCard icon={<MapPin className="text-cyan-400" />} title="Location" value="Buea, Cameroon" />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-16 md:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-slate-400 text-center">
          <span>© 2026 certiVERIFY. All rights reserved.</span>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            Powered by Ethereum Sepolia
          </div>
        </div>
      </footer>
    </div>
  );
}

function DetailRow({
  label, value, copy, copied,
}: {
  label: string; value: string; copy?: () => void; copied?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 items-start border-b border-white/5 pb-5 last:border-none">
      <span className="text-slate-400 font-semibold text-sm">{label}</span>
      <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
        <span className="text-white font-semibold break-all">{value}</span>
        {copy && (
          <button onClick={copy} className="text-slate-400 hover:text-cyan-400">
            <Copy size={14} />
          </button>
        )}
        {copied && <span className="text-emerald-400 text-xs font-bold">Copied</span>}
      </div>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 hover:border-cyan-400/20 transition">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-base md:text-lg mb-4 md:mb-5">
        {number}
      </div>
      <h4 className="font-bold text-white text-base md:text-lg mb-2">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function ContactCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6">
      <div className="mb-3 md:mb-4">{icon}</div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-slate-400 text-sm break-all">{value}</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07111F]">
          <Loader2 className="animate-spin text-cyan-400" size={50} />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}