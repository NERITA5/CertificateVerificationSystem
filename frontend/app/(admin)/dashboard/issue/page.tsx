"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Fingerprint,
  Award,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";

import {
  saveCertificateToDb,
  updateTransactionHash,
} from "@/app/actions/certificates";

import { uploadToIPFS } from "@/app/actions/ipfs";
import { issueCert } from "@/lib/contract";
import { createStudent } from "@/app/actions/create-student";

import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function IssuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [isMinting, setIsMinting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [registrarSig, setRegistrarSig] = useState<string | null>(null);
  const [vcSig, setVcSig] = useState<string | null>(null);

  const prefillName = searchParams.get("name") || "";
  const prefillMatricule = searchParams.get("matricule") || "";
  const prefillFaculty = searchParams.get("faculty") || "";
  const prefillDepartment = searchParams.get("department") || "";
  const isPreFilled = !!prefillName || !!prefillMatricule;

  const [formData, setFormData] = useState({
    studentName: prefillName,
    matricule: prefillMatricule,
    faculty: prefillFaculty,
    degree: "",
    department: prefillDepartment,
    university: "University of Buea",
    dateOfBirth: "",
    dateOfIssue: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      studentName: prefillName || prev.studentName,
      matricule: prefillMatricule || prev.matricule,
      faculty: prefillFaculty || prev.faculty,
      department: prefillDepartment || prev.department,
    }));
  }, [prefillName, prefillMatricule, prefillFaculty, prefillDepartment]);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "registrar" | "vc"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === "registrar") setRegistrarSig(url);
      else setVcSig(url);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePDFBlob = async () => {
    if (!certificateRef.current) return null;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      return pdf.output("blob");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      return null;
    }
  };

  const handleIssueProcess = async () => {
    if (
      !formData.studentName ||
      !formData.matricule ||
      !formData.degree ||
      !formData.faculty ||
      !formData.dateOfBirth
    ) {
      setStatus({ type: "error", msg: "All fields are required." });
      return;
    }

    setIsMinting(true);
    setStatus(null);

    try {
      // PHASE 1 — GENERATE INITIAL PDF (without QR)
      setStatus({ type: "success", msg: "Compiling certificate document..." });
      let pdfBlob = await generatePDFBlob();
      if (!pdfBlob) throw new Error("Failed to generate certificate PDF.");

      // PHASE 2 — UPLOAD TO IPFS + SILENT STUDENT SAVE (parallel)
      setStatus({ type: "success", msg: "Uploading certificate to IPFS..." });
      const ipfsFormData = new FormData();
      ipfsFormData.append(
        "file",
        pdfBlob,
        `${formData.studentName}_Certificate.pdf`
      );

      const studentData = new FormData();
      studentData.append("name", formData.studentName);
      studentData.append("matricule", formData.matricule);
      studentData.append("faculty", formData.faculty);
      studentData.append("department", formData.department);
      studentData.append("email", "");
      studentData.append("skipDuplicateCheck", "true");

      const [ipfsResult] = await Promise.all([
        uploadToIPFS(ipfsFormData),
        createStudent(studentData).catch(() => {}),
      ]);

      if (!ipfsResult.success || !ipfsResult.ipfsHash) {
        throw new Error(ipfsResult.error || "Failed to upload certificate to IPFS.");
      }

      // PHASE 3 — SAVE TO DATABASE
      setStatus({ type: "success", msg: "Saving certificate metadata..." });
      const dbResult = await saveCertificateToDb({
        studentName: formData.studentName,
        matricule: formData.matricule,
        department: formData.department || formData.faculty,
        degree: formData.degree,
        ipfsHash: ipfsResult.ipfsHash,
      });
      if (!dbResult.success || !dbResult.certificate) {
        throw new Error(dbResult.error || "Database save failed.");
      }

      const certificateId = dbResult.certificate.id;
      const certHash = dbResult.certificate.certHash;

      console.log("DB Certificate ID:", certificateId);
      console.log("Certificate Hash:", certHash);

      // PHASE 4 — BLOCKCHAIN MINTING
      setStatus({ type: "success", msg: "Opening MetaMask for blockchain confirmation..." });
      const receipt = await issueCert(
        ipfsResult.ipfsHash,
        formData.studentName,
        formData.matricule,
        formData.degree,
        formData.university
      );
      console.log("Blockchain Receipt:", receipt);
      if (!receipt || !receipt.hash) throw new Error("Blockchain transaction failed.");

      // PHASE 5 — GENERATE QR CODE
      setStatus({ type: "success", msg: "Generating blockchain verification QR code..." });
      const trueVerifyUrl = `${window.location.origin}/verify?hash=${certHash}`;
      const finalQrData = await QRCode.toDataURL(trueVerifyUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrCodeUrl(finalQrData);

      // Let React commit the QR into the DOM before snapshotting
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      // PHASE 6 — GENERATE FINAL PDF WITH QR BAKED IN
      setStatus({ type: "success", msg: "Generating final certificate with QR..." });
      pdfBlob = await generatePDFBlob();
      if (!pdfBlob) throw new Error("Failed to generate final PDF.");

      // PHASE 6b — UPLOAD FINAL PDF
      setStatus({ type: "success", msg: "Uploading final certificate to IPFS..." });
      const finalIpfsFormData = new FormData();
      finalIpfsFormData.append(
        "file",
        pdfBlob,
        `${formData.studentName}_Certificate_Final.pdf`
      );
      const finalIpfsResult = await uploadToIPFS(finalIpfsFormData);
      if (!finalIpfsResult.success || !finalIpfsResult.ipfsHash) {
        throw new Error(finalIpfsResult.error || "Failed to upload final certificate to IPFS.");
      }

      // PHASE 7 — UPDATE DATABASE
      setStatus({ type: "success", msg: "Syncing blockchain data with database..." });
      const updateResult = await updateTransactionHash(
        certificateId,
        receipt.hash,
        finalQrData,
        finalIpfsResult.ipfsHash
      );
      if (!updateResult.success) {
        throw new Error(
          updateResult.error || "Blockchain succeeded but database update failed."
        );
      }

      // PHASE 8 — DOWNLOAD & REDIRECT
      setStatus({ type: "success", msg: "Certificate Issued Successfully!" });
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${formData.studentName.replace(/\s+/g, "_")}_Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => { router.push("/dashboard/my-certificates"); }, 3000);

    } catch (err: any) {
      console.error("Issuance Error:", err);
      setStatus({
        type: "error",
        msg: err?.reason || err?.message || "An error occurred during issuance.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const nameFontSize =
    formData.studentName.length > 25
      ? "2.4rem"
      : formData.studentName.length > 18
      ? "3rem"
      : "3.75rem";

  return (
    <div className="w-full bg-[#F4F7FE]">
      <main className="w-full p-4 md:p-8">

        {/* Header */}
        <header className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#0052FF] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#1B2559]">
              Issue Official Degree
            </h2>
            {isPreFilled && (
              <p className="text-[11px] text-[#0052FF] font-medium mt-0.5">
                Pre-filled from student record: {prefillName}
              </p>
            )}
          </div>
        </header>

        <div className="max-w-5xl mx-auto pb-10">
          {status && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                status.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <p className="text-xs font-bold">{status.msg}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-[#0D214F] flex items-center gap-2">
                <Award size={20} />
                Metadata
              </h3>
            </div>

            <form className="p-6 md:p-8 space-y-6" onSubmit={(e) => e.preventDefault()}>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Student Name</label>
                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    placeholder="Full Legal Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Matricule</label>
                  <input
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    placeholder="FE20A..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">University</label>
                  <input
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Faculty</label>
                  <input
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    placeholder="Engineering & Technology"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Degree</label>
                  <input
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    placeholder="Bachelor of Engineering"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    placeholder="Computer Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    type="date"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Issue</label>
                  <input
                    name="dateOfIssue"
                    value={formData.dateOfIssue}
                    onChange={handleChange}
                    type="date"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex-1 text-center border-2 border-dashed border-slate-200 p-4 rounded-xl relative hover:border-[#0052FF] transition-colors">
                  {registrarSig ? (
                    <img src={registrarSig} className="h-12 mx-auto" alt="Registrar Signature" />
                  ) : (
                    <Upload size={20} className="mx-auto text-slate-300" />
                  )}
                  <p className="text-[9px] mt-2 font-bold uppercase text-slate-400">Registrar Signature</p>
                  <input
                    type="file"
                    onChange={(e) => handleImageUpload(e, "registrar")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 text-center border-2 border-dashed border-slate-200 p-4 rounded-xl relative hover:border-[#0052FF] transition-colors">
                  {vcSig ? (
                    <img src={vcSig} className="h-12 mx-auto" alt="VC Signature" />
                  ) : (
                    <Upload size={20} className="mx-auto text-slate-300" />
                  )}
                  <p className="text-[9px] mt-2 font-bold uppercase text-slate-400">VC Signature</p>
                  <input
                    type="file"
                    onChange={(e) => handleImageUpload(e, "vc")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleIssueProcess}
                disabled={isMinting}
                className="w-full bg-[#0052FF] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0041cc] transition-colors disabled:opacity-70"
              >
                {isMinting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Uploading & Minting Certificate...
                  </span>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Sign & Issue Certificate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* HIDDEN CERTIFICATE TEMPLATE */}
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div
            ref={certificateRef}
            style={{
              backgroundColor: "#ffffff",
              color: "#001A41",
              width: "1120px",
              height: "792px",
              padding: "40px 56px",
              border: "20px solid #001A41",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Georgia, serif",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "12px",
                border: "2px solid #001A41",
                opacity: 0.08,
                pointerEvents: "none",
              }}
            />

            {/* SECTION 1 — University Header */}
            <div style={{ textAlign: "center", width: "100%" }}>
              <h1 style={{ fontSize: "2.6rem", fontWeight: 900, textTransform: "uppercase", color: "#001A41", margin: 0, letterSpacing: "0.05em" }}>
                {formData.university}
              </h1>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.4em", fontStyle: "italic", color: "#64748b", fontFamily: "sans-serif", margin: "4px 0 0 0" }}>
                OFFICIAL ACADEMIC RECORD
              </p>
              <p style={{ fontSize: "1.1rem", fontStyle: "italic", color: "#475569", fontFamily: "sans-serif", margin: "6px 0 0 0" }}>
                This is to certify that
              </p>
            </div>

            {/* SECTION 2 — Student Name + Birth/Matricule */}
            <div style={{ textAlign: "center", width: "100%", padding: "0 40px" }}>
              <h2
                style={{
                  fontSize: nameFontSize,
                  fontWeight: 700,
                  borderBottom: "3px solid #001A41",
                  paddingBottom: "6px",
                  display: "inline-block",
                  paddingLeft: "32px",
                  paddingRight: "32px",
                  lineHeight: 1.2,
                  margin: "0 0 12px 0",
                }}
              >
                {formData.studentName || "STUDENT NAME"}
              </h2>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", fontSize: "0.95rem", fontFamily: "sans-serif", color: "#475569" }}>
                <p style={{ margin: 0 }}>
                  born on{" "}
                  <span style={{ fontWeight: 700, color: "#001A41", textDecoration: "underline" }}>
                    {formData.dateOfBirth || ".........."}
                  </span>
                </p>
                <div style={{ width: "5px", height: "5px", backgroundColor: "#cbd5e1", borderRadius: "50%" }} />
                <p style={{ margin: 0 }}>
                  Matricule No:{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#001A41", textDecoration: "underline" }}>
                    {formData.matricule || ".........."}
                  </span>
                </p>
              </div>
            </div>

            {/* SECTION 3 — Body Text */}
            <div style={{ fontSize: "0.95rem", lineHeight: 1.85, textAlign: "center", maxWidth: "900px", fontFamily: "sans-serif", color: "#1e293b", padding: "0 20px" }}>
              fulfilled all the requirements of the{" "}
              <span style={{ fontWeight: 700, textTransform: "uppercase", textDecoration: "underline" }}>
                {formData.university}
              </span>{" "}
              and satisfactorily completed the prescribed courses in the{" "}
              <span style={{ fontWeight: 700, textDecoration: "underline" }}>
                {formData.faculty || "..................."}
              </span>
              {formData.department && (
                <>
                  {" "}in the Department of{" "}
                  <span style={{ fontWeight: 700, textDecoration: "underline" }}>
                    {formData.department}
                  </span>
                </>
              )}{" "}
              has under the authority of Senate, been admitted to the{" "}
              <span style={{ fontWeight: 700, fontSize: "1.1rem", textDecoration: "underline", color: "#0052FF" }}>
                {formData.degree || "..................."}
              </span>.
              <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#64748b", margin: "8px 0 2px 0" }}>
                In testimony whereof, the seal of the university and the signature of its officers are here unto affixed.
              </p>
              <p style={{ fontSize: "0.8rem", fontStyle: "italic", textDecoration: "underline", color: "#64748b", margin: 0 }}>
                Given this day: {formData.dateOfIssue}
              </p>
            </div>

            {/* SECTION 4 — Signatures + QR */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 60px" }}>
              <div style={{ textAlign: "center", width: "180px", borderTop: "2px solid #001A41", paddingTop: "10px" }}>
                {registrarSig && (
                  <img src={registrarSig} style={{ height: "48px", margin: "0 auto 4px" }} alt="Registrar" />
                )}
                <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#001A41", margin: 0 }}>
                  Registrar
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Verification QR Code"
                    style={{
                      width: "110px",
                      height: "110px",
                      imageRendering: "pixelated",
                      border: "3px solid #ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                ) : (
                  <div style={{ width: "110px", height: "110px", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#94a3b8", textAlign: "center", padding: "8px" }}>
                    QR generates after blockchain
                  </div>
                )}
                <p style={{ fontSize: "0.55rem", fontWeight: 700, color: "#0052FF", margin: "4px 0 0 0" }}>
                  SECURED BY ETHEREUM
                </p>
              </div>

              <div style={{ textAlign: "center", width: "180px", borderTop: "2px solid #001A41", paddingTop: "10px" }}>
                {vcSig && (
                  <img src={vcSig} style={{ height: "48px", margin: "0 auto 4px" }} alt="Vice Chancellor" />
                )}
                <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#001A41", margin: 0 }}>
                  Vice Chancellor
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}