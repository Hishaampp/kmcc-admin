"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");

  // Edit
  const [showEditBox, setShowEditBox] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);

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

  const updateStatus = async (projectId: string, newStatus: string) => {
    await updateDoc(doc(db, "projects", projectId), {
      status: newStatus,
    });

    fetchProjects();
  };

  // SAVE EDIT
  const saveEdit = async () => {
    if (!editProject || !editProject.name.trim()) return;

    await updateDoc(doc(db, "projects", editProject.id), {
      name: editProject.name,
    });

    setShowEditBox(false);
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded-lg hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Manage Projects
      </h1>

      {/* Add Project */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Project Name"
          className="border rounded px-3 py-2 w-full text-black placeholder-gray-800"
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
              <div>
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-600">Status: {p.status}</p>
              </div>

              <div className="flex items-center gap-3">

                <select
                  value={p.status}
                  onChange={(e) => updateStatus(p.id, e.target.value)}
                  className="border rounded px-2 py-1 text-black"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button
                  onClick={() => {
                    setEditProject({ ...p });
                    setShowEditBox(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* EDIT MODAL */}
      {showEditBox && editProject && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[360px]">

            <h2 className="text-lg font-semibold mb-3 text-gray-900">
              Edit Project Name
            </h2>

            <label className="text-sm text-gray-700">
              Project Name
            </label>

            <input
              value={editProject.name}
              onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
              className="border rounded px-3 py-2 w-full text-black mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditBox(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
