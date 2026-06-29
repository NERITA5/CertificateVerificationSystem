"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Search, X, Award, Trash2 } from "lucide-react";
import { createStudent } from "@/app/actions/create-student";

interface Student {
  id: string;
  name: string;
  email: string;
  matricule: string;
  department: string;
  faculty: string;
  universityId?: string;
  createdAt?: Date;
}

export default function StudentsClient({
  students = [],
  universityId,
}: {
  students: Student[];
  universityId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localStudents, setLocalStudents] = useState<Student[]>(students);

  useEffect(() => {
    setLocalStudents(students);
  }, [students]);

  const filteredStudents = localStudents.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.matricule?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("universityId", universityId);

    const result = await createStudent(formData);
    setIsSubmitting(false);

    if (result.success && result.student) {
      setLocalStudents((prev) => [result.student as Student, ...prev]);
      setIsModalOpen(false);
    } else {
      alert(result.error || "Failed to add student.");
    }
  }

  function handleIssueCertificate(student: Student) {
    const params = new URLSearchParams({
      name: student.name,
      matricule: student.matricule,
      faculty: student.faculty,
      department: student.department,
    });
    router.push(`/dashboard/issue?${params.toString()}`);
  }

  return (
    <div className="w-full bg-[#F4F7FE] p-4 md:p-8">

      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold text-[#1B2559]">Students</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0052FF] hover:bg-[#0041CC] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <UserPlus size={16} /> Add New Student
        </button>
      </header>

      {/* Table Card */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="font-bold text-[#1B2559]">
            All Students{" "}
            <span className="text-slate-400 font-normal text-sm">
              ({localStudents.length})
            </span>
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or matricule..."
              className="pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#0052FF] w-full sm:w-72 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-slate-400 uppercase border-b text-[11px]">
                <th className="pb-4 font-semibold">Name</th>
                <th className="pb-4 font-semibold">Email</th>
                <th className="pb-4 font-semibold">Matricule</th>
                <th className="pb-4 font-semibold">Department</th>
                <th className="pb-4 font-semibold">Faculty</th>
                <th className="pb-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 font-bold text-[#1B2559]">
                      {student.name}
                    </td>
                    <td className="py-4 text-slate-500">{student.email}</td>
                    <td className="py-4 text-slate-500 font-mono">
                      {student.matricule}
                    </td>
                    <td className="py-4 text-slate-500">{student.department}</td>
                    <td className="py-4 text-slate-500">{student.faculty}</td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleIssueCertificate(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-[#0052FF] text-[#0052FF] hover:text-white border border-[#0052FF] rounded-lg text-[11px] font-bold transition-all"
                      >
                        <Award size={13} />
                        Issue Certificate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-400 italic"
                  >
                    {search
                      ? "No matching students found."
                      : "No students yet. Add one to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-[#1B2559]">
                Add New Student
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Full Name
                </label>
                <input
                  name="name"
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Matricule
                  </label>
                  <input
                    name="matricule"
                    placeholder="e.g. FE20A001"
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Department
                  </label>
                  <input
                    name="department"
                    placeholder="e.g. Computer Eng."
                    className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Faculty
                </label>
                <input
                  name="faculty"
                  placeholder="e.g. Engineering & Technology"
                  className="w-full px-4 py-3 bg-[#F4F7FE] rounded-xl text-sm border border-transparent focus:border-[#0052FF] focus:outline-none transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#0052FF] hover:bg-[#0041CC] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Saving...
                  </span>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Save Student Profile
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}