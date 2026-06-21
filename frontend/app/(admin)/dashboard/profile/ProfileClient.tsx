"use client";
import { useState, useEffect } from "react";


export default function ProfileClient({ initialData }: { initialData: any }) {
  const [profile, setProfile] = useState({
    name: "", email: "", address: "", website: ""
  });

  // Sync state when initialData arrives from the server
  useEffect(() => {
    if (initialData) {
      setProfile({
        name: initialData.name || "",
        email: initialData.email || "",
        address: initialData.address || "",
        website: initialData.website || ""
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (response.ok) alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FE]">
      
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-2xl font-bold text-[#1B2559] mb-8">Institution Profile</h1>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Institution Name</label>
              <input name="name" value={profile.name} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contact Email</label>
              <input name="email" value={profile.email} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Website</label>
                <input name="website" value={profile.website} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Location</label>
                <input name="address" value={profile.address} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200" />
              </div>
            </div>
          </div>
          <button onClick={handleSave} className="mt-8 bg-[#1B2559] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0f173d]">
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}