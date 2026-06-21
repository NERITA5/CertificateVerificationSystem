"use client";

import React, { useState } from "react";

import { UserPlus, Search, Building2, X } from "lucide-react";
import { createStudent } from "@/app/actions/create-student";

export default function StudentsClient({ students = [], universityId }: { students: any[], universityId: string }) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = students.filter((s) => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.matricule?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddStudent(formData: FormData) {
    setIsSubmitting(true);
    
    // Explicitly append the universityId if it's missing from the form fields
    formData.append("universityId", universityId);
    
    const result = await createStudent(formData);
    setIsSubmitting(false);
    
    if (result.success) {
      setIsModalOpen(false);
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-bold text-[#1B2559]">Students</h2>
          <div className="flex items-center gap-3 bg-white p-2 rounded-full border border-slate-200">
             <Building2 size={16} className="text-[#0052FF]" />
          </div>
        </header>

        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="font-bold text-[#1B2559]">All Students</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by name or ID..."
                  className="pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0052FF] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"
              >
                <UserPlus size={16} /> Add New Student
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-slate-400 uppercase border-b">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Matricule</th>
                  <th className="pb-4">Department</th>
                  <th className="pb-4">Faculty</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-t hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-bold text-[#1B2559]">{student.name}</td>
                      <td className="py-4 text-slate-600">{student.email}</td>
                      <td className="py-4 text-slate-500 font-mono">{student.matricule}</td>
                      <td className="py-4 text-slate-500">{student.department}</td>
                      <td className="py-4 text-slate-500">{student.faculty}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 italic">No matching students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form action={handleAddStudent} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#1B2559]">Add New Student</h3>
              <button type="button" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input name="name" placeholder="Full Name" className="col-span-2 border p-3 rounded-xl" required />
              <input name="email" type="email" placeholder="Email Address" className="col-span-2 border p-3 rounded-xl" required />
              <input name="matricule" placeholder="Matricule/ID" className="border p-3 rounded-xl" required />
              <input name="department" placeholder="Department" className="border p-3 rounded-xl" required />
              <input name="faculty" placeholder="Faculty" className="col-span-2 border p-3 rounded-xl" required />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-6 bg-[#0052FF] text-white p-3 rounded-xl font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Student Profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}