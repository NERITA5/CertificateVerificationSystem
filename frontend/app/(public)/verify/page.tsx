
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyCert } from "@/lib/contract";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  ShieldCheck,
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
  Home,
} from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const certHash = searchParams.get("hash");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resolvedIpfsHash, setResolvedIpfsHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const qrRegionId = "html5qr-reader";

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AUTO VERIFY
  useEffect(() => {
    if (certHash) {
      runVerificationRoutine(certHash);
    }
  }, [certHash]);

  // START SCANNER
  useEffect(() => {
    if (certHash || result || loading) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        if (!html5QrcodeRef.current) {
          html5QrcodeRef.current = new Html5Qrcode(qrRegionId);
        }

        const devices = await Html5Qrcode.getCameras();

        if (!devices || devices.length === 0) {
          setError("No camera detected.");
          return;
        }

        if (mounted) {
          setIsScanning(true);

          await html5QrcodeRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: {
                width: 240,
                height: 240,
              },
              aspectRatio: 1,
            },
            async (decodedText) => {
              await handleDecodedUrl(decodedText);
            },
            () => {}
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          "Unable to access scanner. Please allow camera permissions."
        );

        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;

      if (html5QrcodeRef.current?.isScanning) {
        html5QrcodeRef.current.stop().catch(() => {});
      }
    };
  }, [certHash, result, loading]);

  const handleDecodedUrl = async (text: string) => {
    try {
      let hash = text.trim();

      if (text.includes("?hash=")) {
        const url = new URL(text);
        hash = url.searchParams.get("hash") || text.trim();
      }

      if (html5QrcodeRef.current?.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      setIsScanning(false);

      router.push(`/verify?hash=${hash}`);
    } catch (err) {
      console.error(err);
    }
  };

  const restartScanner = async () => {
    setResult(null);
    setError(null);
    setResolvedIpfsHash("");

    if (html5QrcodeRef.current?.isScanning) {
      await html5QrcodeRef.current.stop().catch(() => {});
    }

    router.push("/verify");
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode("hidden-file-reader");

      const decodedText = await scanner.scanFile(file, true);

      await handleDecodedUrl(decodedText);
    } catch (err) {
      console.error(err);

      setLoading(false);

      setError("Could not detect QR code from image.");
    }
  };

  const runVerificationRoutine = async (hashToVerify: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
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
        console.warn(dbErr);
      }

      let data: any = null;

      try {
        data = await verifyCert(hashToVerify);
      } catch (bcErr) {
        if (dbCertData) {
          data = {
            isValid: true,
            isRevoked: false,
            studentName: dbCertData.studentName,
            degree: dbCertData.degree,
            university: dbCertData.university,
            timestamp:
              dbCertData.timestamp || Math.floor(Date.now() / 1000),
          };
        } else {
          throw bcErr;
        }
      }

      if (data && data.isValid && !data.isRevoked) {
        setResult({
          ...data,
          studentName: dbCertData?.studentName || data.studentName,
          degree: dbCertData?.degree || data.degree,
          matricule: dbCertData?.matricule || data.matricule || null,
          department: dbCertData?.department || data.department || null,
          transactionHash:
            hashToVerify ||
            dbCertData?.transactionHash ||
            data.transactionHash ||
            null,
        });
      } else if (data?.isRevoked) {
        setError("This certificate has been revoked.");
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-white scroll-smooth">
      <div id="hidden-file-reader" className="hidden"></div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111F]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a
            href="#home"
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2.5 rounded-2xl shadow-lg shadow-cyan-500/20">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h1 className="font-black text-xl tracking-wide text-white">
                UniCert
              </h1>

              <p className="text-[11px] text-slate-400 font-medium">
                Blockchain Verification
              </p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a
              href="#home"
              className="hover:text-cyan-400 transition"
            >
              Home
            </a>

            <a
              href="#about"
              className="hover:text-cyan-400 transition"
            >
              About
            </a>

            <a
              href="#how-it-works"
              className="hover:text-cyan-400 transition"
            >
              How It Works
            </a>

            <a
              href="#contact"
              className="hover:text-cyan-400 transition"
            >
              Contact Us
            </a>
          </nav>

          <div className="flex items-center gap-2 text-sm text-slate-300 font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Globe size={15} /> EN
          </div>
        </div>
      </header>

      <main
        id="home"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14"
      >
        {/* HERO */}
        <div className="grid lg:grid-cols-2 gap-14 items-center mb-16">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ShieldCheck size={16} /> Secure Blockchain Verification
            </div>

            <h2 className="text-5xl lg:text-6xl font-black leading-tight text-white">
              Verify Academic Certificates Instantly
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mt-6 max-w-xl">
              Securely scan and validate academic certificates using blockchain-powered authentication technology.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>

            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-cyan-500/10">
              <div className="flex items-center gap-2 mb-6">
                <QrCode className="text-cyan-400" size={18} />

                <span className="font-bold text-cyan-300 text-sm tracking-wide">
                  QR CODE SCANNER
                </span>
              </div>

              <div className="relative w-full aspect-square rounded-3xl overflow-hidden border border-white/10 bg-black">
                <div id={qrRegionId} className="w-full h-full"></div>

                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0B1629]">
                    <QrCode size={70} className="text-slate-700" />
                  </div>
                )}
              </div>

              <p className="text-center text-slate-400 text-sm mt-5">
                Scan certificate QR code
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <Upload size={17} /> Upload QR Image
              </button>
            </div>
          </div>
        </div>

        {/* RESULT AREA */}
        <div>
          {loading ? (
            <div className="bg-white/5 border border-white/10 rounded-[32px] min-h-[420px] flex flex-col items-center justify-center backdrop-blur-xl">
              <Loader2
                size={55}
                className="animate-spin text-cyan-400 mb-5"
              />

              <h3 className="text-2xl font-bold text-white">
                Verifying Certificate...
              </h3>

              <p className="text-slate-400 mt-2">
                Connecting to blockchain network.
              </p>
            </div>
          ) : result ? (
            <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
              <div className="p-8 border-b border-white/10 bg-emerald-500/10 flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={34} />
                </div>

                <div>
                  <h3 className="text-3xl font-black text-emerald-400">
                    Certificate Verified
                  </h3>

                  <p className="text-slate-300 mt-2">
                    This certificate is authentic and securely stored on the blockchain.
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <DetailRow
                  label="Certificate ID"
                  value={
                    certHash
                      ? `${certHash.substring(0, 16)}...`
                      : "N/A"
                  }
                  copy={() => copyToClipboard(certHash || "")}
                  copied={copied}
                />

                <DetailRow
                  label="Student Name"
                  value={result.studentName}
                />

                <DetailRow label="Degree" value={result.degree} />

                <DetailRow
                  label="Institution"
                  value={result.university || "University of Buea"}
                />

                {result.department && (
                  <DetailRow
                    label="Department"
                    value={result.department}
                  />
                )}

                {result.transactionHash && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <span className="text-slate-400 font-semibold text-sm">
                      Blockchain Tx
                    </span>

                    <div className="md:col-span-2 break-all">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        {result.transactionHash.substring(0, 25)}...
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {resolvedIpfsHash && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${resolvedIpfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <Download size={18} /> Download Certificate
                    </a>
                  )}

                  <button
                    onClick={restartScanner}
                    className="border border-white/10 bg-white/5 hover:bg-white/10 transition py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} /> Verify Another
                  </button>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[32px] min-h-[400px] flex flex-col items-center justify-center text-center p-10">
              <h3 className="text-3xl font-black text-red-400 mb-4">
                Verification Failed
              </h3>

              <p className="text-slate-300 max-w-md">{error}</p>

              <button
                onClick={restartScanner}
                className="mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition px-8 py-3 rounded-2xl font-bold"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-[32px] min-h-[400px] flex flex-col items-center justify-center text-center p-10 backdrop-blur-xl">
              <ShieldCheck size={65} className="text-slate-700 mb-5" />

              <h3 className="text-3xl font-black text-white">
                Awaiting Verification
              </h3>

              <p className="text-slate-400 mt-3 max-w-md leading-relaxed">
                Scan a QR code or upload a QR image to begin verification.
              </p>
            </div>
          )}
        </div>

        {/* ABOUT */}
        <section id="about" className="mt-28 scroll-mt-28">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-5">
              <Info className="text-cyan-400" />

              <h3 className="text-3xl font-black text-white">
                About UniCert
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed text-lg">
              UniCert is a blockchain-based academic certificate verification platform designed to prevent certificate fraud and simplify verification for institutions, employers, and students.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="mt-28 scroll-mt-28"
        >
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
            <h3 className="text-3xl font-black text-white mb-10">
              How It Works
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StepCard
                number="1"
                title="Scan QR"
                description="Scan the certificate QR code instantly."
              />

              <StepCard
                number="2"
                title="Retrieve Data"
                description="The system securely retrieves certificate records."
              />

              <StepCard
                number="3"
                title="Verify Blockchain"
                description="Blockchain data is checked for authenticity."
              />

              <StepCard
                number="4"
                title="View Result"
                description="The verification result appears instantly."
              />
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="mt-28 scroll-mt-28">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
            <h3 className="text-3xl font-black text-white mb-10">
              Contact Us
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <ContactCard
                icon={<Mail className="text-cyan-400" />}
                title="Email"
                value="support@unicert.edu"
              />

              <ContactCard
                icon={<Phone className="text-cyan-400" />}
                title="Phone"
                value="+237 6 12 34 56 78"
              />

              <ContactCard
                icon={<MapPin className="text-cyan-400" />}
                title="Location"
                value="Yaoundé, Cameroon"
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span>© 2026 UniCert. All rights reserved.</span>

          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            Powered by Ethereum Sepolia
          </div>
        </div>
      </footer>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copy,
  copied,
}: {
  label: string;
  value: string;
  copy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border-b border-white/5 pb-5 last:border-none">
      <span className="text-slate-400 font-semibold text-sm">
        {label}
      </span>

      <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
        <span className="text-white font-semibold break-all">
          {value}
        </span>

        {copy && (
          <button
            onClick={copy}
            className="text-slate-400 hover:text-cyan-400"
          >
            <Copy size={14} />
          </button>
        )}

        {copied && (
          <span className="text-emerald-400 text-xs font-bold">
            Copied
          </span>
        )}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-cyan-400/20 transition">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg mb-5">
        {number}
      </div>

      <h4 className="font-bold text-white text-lg mb-2">{title}</h4>

      <p className="text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="mb-4">{icon}</div>

      <h4 className="font-bold text-white mb-2">{title}</h4>

      <p className="text-slate-400 text-sm">{value}</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07111F]">
          <Loader2
            className="animate-spin text-cyan-400"
            size={50}
          />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}