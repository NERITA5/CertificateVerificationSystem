import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import StudentsClient from "@/components/StudentsClient";

export default async function StudentsPage() {
  const cookieStore = await cookies();
  const wallet = cookieStore.get("wallet_address")?.value;

  let universityId = "";

  if (wallet) {
    const university = await prisma.universityApplication.findFirst({
      where: { walletAddress: { equals: wallet, mode: "insensitive" } },
      select: { id: true },
    });
    universityId = university?.id || "";
  }

  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full">
      <StudentsClient students={students} universityId={universityId} />
    </div>
  );
}