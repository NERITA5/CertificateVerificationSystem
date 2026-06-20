-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "ipfsHash" TEXT;

-- CreateTable
CREATE TABLE "UniversityApplication" (
    "id" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "accreditationId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "documents" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniversityApplication_walletAddress_key" ON "UniversityApplication"("walletAddress");
