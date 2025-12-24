"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async () => {
    if (!name.trim()) return;

    await addDoc(collection(db, "projects"), {
      name,
      status: "active",
      createdAt: serverTimestamp(),
    });

    setName("");
    fetchProjects();
  };

  // 🔥 Update Status
  const updateStatus = async (projectId: string, newStatus: string) => {
    await updateDoc(doc(db, "projects", projectId), {
      status: newStatus,
    });

    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Manage Projects
      </h1>

      {/* Add Project */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Project Name"
          className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
        />

        <button
          onClick={addProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          All Projects
        </h2>

        {projects.length === 0 && (
          <p className="text-gray-600">No projects added yet.</p>
        )}

        <ul className="space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
            >
              <span className="font-medium text-gray-900">
                {p.name}
              </span>

              <div className="flex items-center gap-3">
                
                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    p.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.status}
                </span>

                {/* Status Dropdown */}
                <select
                  value={p.status}
                  onChange={(e) => updateStatus(p.id, e.target.value)}
                  className="border rounded px-2 py-1 text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
