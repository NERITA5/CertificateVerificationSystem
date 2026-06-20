-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certHash" TEXT NOT NULL,
    "transactionHash" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "qrCodeData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_matricule_key" ON "Certificate"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certHash_key" ON "Certificate"("certHash");

-- CreateIndex
CREATE INDEX "Certificate_certHash_idx" ON "Certificate"("certHash");

-- CreateIndex
CREATE INDEX "Certificate_matricule_idx" ON "Certificate"("matricule");
