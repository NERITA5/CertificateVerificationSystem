import { prisma } from "@/lib/prisma";
import StudentsClient from "@/components/StudentsClient";

export default async function StudentsPage() {
  // Fetch students directly from the database
  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    // 'w-full' ensures the container occupies the full available width.
    // Ensure your parent 'layout.tsx' uses 'flex' and sets the sidebar width,
    // and the page content div is set to 'flex-1'.
    <div className="w-full">
      <main className="w-full p-8">
        <StudentsClient 
          students={students} 
          universityId={students[0]?.universityId || "N/A"} 
        />
      </main>
    </div>
  );
}