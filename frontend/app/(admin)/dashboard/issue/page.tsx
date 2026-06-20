"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
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

import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function IssuePage() {
  const router = useRouter();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [isMinting, setIsMinting] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [registrarSig, setRegistrarSig] = useState<string | null>(null);
  const [vcSig, setVcSig] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentName: "",
    matricule: "",
    faculty: "",
    degree: "",
    department: "",
    university: "University of Buea",
    dateOfBirth: "",
    dateOfIssue: new Date().toISOString().split("T")[0],
  });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "registrar" | "vc"
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const url = URL.createObjectURL(file);

      if (type === "registrar") {
        setRegistrarSig(url);
      } else {
        setVcSig(url);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generatePDFBlob = async () => {
    if (!certificateRef.current) return null;

    await new Promise((resolve) => setTimeout(resolve, 2000));

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
      setStatus({
        type: "error",
        msg: "All fields are required.",
      });

      return;
    }

    setIsMinting(true);
    setStatus(null);

    try {
      /*
      =========================================================
      PHASE 1 — INITIAL PDF GENERATION
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Compiling certificate document...",
      });

      let pdfBlob = await generatePDFBlob();

      if (!pdfBlob) {
        throw new Error("Failed to generate certificate PDF.");
      }

      /*
      =========================================================
      PHASE 2 — UPLOAD PDF TO IPFS
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Uploading certificate to IPFS...",
      });

      const ipfsFormData = new FormData();

      ipfsFormData.append(
        "file",
        pdfBlob,
        `${formData.studentName}_Certificate.pdf`
      );

      const ipfsResult = await uploadToIPFS(ipfsFormData);

      if (!ipfsResult.success || !ipfsResult.ipfsHash) {
        throw new Error(
          ipfsResult.error || "Failed to upload certificate to IPFS."
        );
      }

      /*
      =========================================================
      PHASE 3 — CREATE DATABASE RECORD
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Saving certificate metadata...",
      });

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

      /*
      IMPORTANT:
      Capture ID immediately and persist it.
      */

      const certificateId = dbResult.certificate.id;
      const certHash = dbResult.certificate.certHash;

      console.log("DB Certificate ID:", certificateId);
      console.log("Certificate Hash:", certHash);

      /*
      =========================================================
      PHASE 4 — BLOCKCHAIN MINTING
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Opening MetaMask for blockchain confirmation...",
      });

      const receipt = await issueCert(
        ipfsResult.ipfsHash,
        formData.studentName,
        formData.matricule,
        formData.degree,
        formData.university
      );

      console.log("Blockchain Receipt:", receipt);

      if (!receipt || !receipt.hash) {
        throw new Error("Blockchain transaction failed.");
      }

      /*
      =========================================================
      PHASE 5 — GENERATE FINAL QR
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Generating blockchain verification QR code...",
      });

      const trueVerifyUrl = `${window.location.origin}/verify?hash=${certHash}`;

      const finalQrData = await QRCode.toDataURL(trueVerifyUrl, {
        width: 250,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      setQrCodeUrl(finalQrData);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      /*
      =========================================================
      PHASE 6 — FINAL PDF WITH QR
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Generating final certificate...",
      });

      pdfBlob = await generatePDFBlob();

      if (!pdfBlob) {
        throw new Error("Failed to generate final PDF.");
      }

      /*
      =========================================================
      PHASE 7 — UPDATE DATABASE
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Syncing blockchain data with database...",
      });

      console.log(
        "Updating DB:",
        certificateId,
        receipt.hash,
        finalQrData
      );

      const updateResult = await updateTransactionHash(
        certificateId,
        receipt.hash,
        finalQrData
      );

      console.log("Update Result:", updateResult);

      if (!updateResult.success) {
        throw new Error(
          updateResult.error ||
            "Blockchain succeeded but database update failed."
        );
      }

      /*
      =========================================================
      PHASE 8 — SUCCESS
      =========================================================
      */

      setStatus({
        type: "success",
        msg: "Certificate Issued Successfully!",
      });

      const downloadUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download = `${formData.studentName.replace(
        /\s+/g,
        "_"
      )}_Certificate.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        router.push("/dashboard/my-certificates");
      }, 3000);
    } catch (err: any) {
      console.error("Issuance Error:", err);

      setStatus({
        type: "error",
        msg:
          err?.reason ||
          err?.message ||
          "An error occurred during issuance.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      <Sidebar  />

      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#0052FF]"
            >
              <ArrowLeft size={20} />
            </Link>

            <h2 className="text-lg font-bold text-[#1B2559]">
              Issue Official Degree
            </h2>
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

            <form
              className="p-8 space-y-6"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Student Name
                  </label>

                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                    placeholder="Full Legal Name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Matricule
                  </label>

                  <input
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                    placeholder="FE20A..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    University
                  </label>

                  <input
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Faculty
                  </label>

                  <input
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                    placeholder="Engineering & Technology"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Degree
                  </label>

                  <input
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                    placeholder="Bachelor of Engineering"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Department
                  </label>

                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                    placeholder="Computer Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Date of Birth
                  </label>

                  <input
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    type="date"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Date of Issue
                  </label>

                  <input
                    name="dateOfIssue"
                    value={formData.dateOfIssue}
                    onChange={handleChange}
                    type="date"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex-1 text-center border-2 border-dashed border-slate-200 p-4 rounded-xl relative">
                  {registrarSig ? (
                    <img
                      src={registrarSig}
                      className="h-12 mx-auto"
                      alt="Registrar Signature"
                    />
                  ) : (
                    <Upload size={20} className="mx-auto text-slate-300" />
                  )}

                  <p className="text-[9px] mt-2 font-bold uppercase">
                    Registrar Signature
                  </p>

                  <input
                    type="file"
                    onChange={(e) => handleImageUpload(e, "registrar")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex-1 text-center border-2 border-dashed border-slate-200 p-4 rounded-xl relative">
                  {vcSig ? (
                    <img
                      src={vcSig}
                      className="h-12 mx-auto"
                      alt="VC Signature"
                    />
                  ) : (
                    <Upload size={20} className="mx-auto text-slate-300" />
                  )}

                  <p className="text-[9px] mt-2 font-bold uppercase">
                    VC Signature
                  </p>

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
            }}
            className="w-[1120px] h-[792px] p-20 border-[20px] border-[#001A41] relative flex flex-col items-center justify-between font-serif"
          >
            <div
              className="absolute inset-4 border-2"
              style={{
                borderColor: "#001A41",
                opacity: 0.1,
              }}
            />

            <div className="text-center">
              <h1
                className="text-5xl font-black uppercase"
                style={{ color: "#001A41" }}
              >
                {formData.university}
              </h1>

              <p
                className="text-sm tracking-[0.4em] font-sans italic"
                style={{ color: "#64748b" }}
              >
                OFFICIAL ACADEMIC RECORD
              </p>
            </div>

            <div className="text-center space-y-6 px-10">
              <p
                className="text-2xl italic font-sans"
                style={{ color: "#475569" }}
              >
                This is to certify that
              </p>

              <h2
                className="text-6xl font-bold border-b-4 pb-2 inline-block px-10"
                style={{
                  borderBottomColor: "#001A41",
                }}
              >
                {formData.studentName || "STUDENT NAME"}
              </h2>

              <div className="flex justify-center items-center gap-8 text-lg font-sans text-slate-600">
                <p>
                  born on{" "}
                  <span className="font-bold text-[#001A41] underline">
                    {formData.dateOfBirth || ".........."}
                  </span>
                </p>

                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>

                <p>
                  Matricule No:{" "}
                  <span className="font-mono font-bold text-[#001A41] underline">
                    {formData.matricule || ".........."}
                  </span>
                </p>
              </div>

              <div
                className="text-xl leading-[2.2] text-center max-w-4xl mx-auto font-sans"
                style={{ color: "#1e293b" }}
              >
                fulfilled all the requirements of the{" "}
                <span className="font-bold uppercase underline decoration-1">
                  {formData.university}
                </span>{" "}
                and satisfactorily completed the prescribed courses in the{" "}
                <span className="font-bold underline decoration-1">
                  {formData.faculty || "..................."}
                </span>

                {formData.department && (
                  <>
                    {" "}
                    in the Department of{" "}
                    <span className="font-bold underline decoration-1">
                      {formData.department}
                    </span>
                  </>
                )}{" "}
                has under the authority of Senate, been admitted to the{" "}
                <span
                  className="font-bold text-2xl underline decoration-1"
                  style={{ color: "#0052FF" }}
                >
                  {formData.degree || "..................."}
                </span>
                .
              </div>

              <p
                className="text-sm italic max-w-3xl mx-auto leading-relaxed"
                style={{ color: "#64748b" }}
              >
                In testimony whereof, the seal of the university and the
                signature of its officers are here unto affixed.
              </p>

              <p
                className="text-md font-sans italic underline underline-offset-4 tracking-wider"
                style={{ color: "#64748b" }}
              >
                Given this day: {formData.dateOfIssue}
              </p>
            </div>

            <div className="w-full flex justify-between items-end px-16 pb-6">
              <div
                className="text-center w-56 border-t-2 pt-4"
                style={{ borderTopColor: "#001A41" }}
              >
                {registrarSig && (
                  <img
                    src={registrarSig}
                    className="h-16 mx-auto mb-1"
                    alt="Registrar"
                  />
                )}

                <p
                  className="text-xs font-bold uppercase"
                  style={{ color: "#001A41" }}
                >
                  Registrar
                </p>
              </div>

              <div className="flex flex-col items-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    className="w-28 h-28 border-4 border-white shadow-lg"
                    alt="Verification QR Code"
                  />
                ) : (
                  <div
                    className="w-28 h-28 bg-white border flex items-center justify-center text-[10px]"
                    style={{ color: "#94a3b8" }}
                  >
                    Loading Verification Anchor...
                  </div>
                )}

                <p
                  className="text-[10px] mt-2 font-bold"
                  style={{ color: "#0052FF" }}
                >
                  SECURED BY ETHEREUM
                </p>
              </div>

              <div
                className="text-center w-56 border-t-2 pt-4"
                style={{ borderTopColor: "#001A41" }}
              >
                {vcSig && (
                  <img
                    src={vcSig}
                    className="h-16 mx-auto mb-1"
                    alt="Vice Chancellor"
                  />
                )}

                <p
                  className="text-xs font-bold uppercase"
                  style={{ color: "#001A41" }}
                >
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