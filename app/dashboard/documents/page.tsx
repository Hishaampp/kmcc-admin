"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, storage, auth } from "@/lib/firebase";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";

/* ================= TYPES ================= */

type Project = {
  id: string;
  name: string;
};

type DocumentItem = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  storagePath: string;
  url: string;
  fileSize: number;
  fileType: string;
  projectId: string | null;
  projectName: string | null;
};

/* ================= COMPONENT ================= */

export default function DocumentsPage() {
  const [user, setUser] = useState<any>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const CATEGORIES = [
    "Land Documents",
    "Legal Papers",
    "Financial Records",
    "Contracts",
    "Member Documents",
    "Project Files",
    "Tax Documents",
    "Other",
  ];

  /* ================= AUTH + LOAD DATA ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadDocuments();
        loadProjects();
      }
    });
    return () => unsub();
  }, []);

  const loadProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
  };

  const loadDocuments = async () => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setDocuments(
      snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem))
    );
  };

  /* ================= UPLOAD ================= */

  const uploadDocument = async () => {
    if (!file || !title || !category || !user) return;

    setUploading(true);
    setProgress(0);

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `documents/${Date.now()}-${safeName}`;
    const storageRef = ref(storage, storagePath);

    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => {
        setProgress(
          Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        );
      },
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);

        const selectedProject =
          projectId === "none"
            ? null
            : projects.find(p => p.id === projectId) ?? null;

        await addDoc(collection(db, "documents"), {
          title,
          category,
          fileName: file.name,
          storagePath,
          url,
          fileSize: file.size,
          fileType: file.type,
          projectId: selectedProject ? selectedProject.id : null,
          projectName: selectedProject ? selectedProject.name : null,
          uploadedBy: user.email,
          createdAt: serverTimestamp(),
        });

        setTitle("");
        setCategory("");
        setProjectId("none");
        setFile(null);
        setUploading(false);
        setProgress(0);

        loadDocuments();
      }
    );
  };

  /* ================= DELETE ================= */

  const deleteDocument = async (docItem: DocumentItem) => {
    if (!confirm(`Delete "${docItem.title}"?`)) return;

    await deleteObject(ref(storage, docItem.storagePath));
    await deleteDoc(doc(db, "documents", docItem.id));

    loadDocuments();
  };

  /* ================= FILTERING ================= */

  const filteredDocuments = documents.filter(d => {
    const textMatch =
      `${d.title} ${d.fileName}`.toLowerCase().includes(search.toLowerCase());

    const projectMatch =
      projectFilter === "all"
        ? true
        : projectFilter === "none"
        ? d.projectId === null
        : d.projectId === projectFilter;

    return textMatch && projectMatch;
  });

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      <Link
        href="/dashboard"
        className="mb-4 inline-block px-4 py-2 bg-black text-white rounded"
      >
        ← Dashboard Home
      </Link>

      <h1 className="text-3xl font-bold mb-6">Documents Vault</h1>

      {/* ================= UPLOAD BOX ================= */}

      <div className="bg-white p-6 rounded-xl border mb-6">
        <div className="grid md:grid-cols-5 gap-3 mb-4">

          <input
            className="border p-2 rounded"
            placeholder="Document Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="none">No Project (General)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="file"
            className="border p-2 rounded"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={uploadDocument}
            disabled={uploading}
            className={`rounded px-4 ${
              uploading ? "bg-gray-300" : "bg-green-600 text-white"
            }`}
          >
            {uploading ? `${progress}%` : "Upload"}
          </button>
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div className="flex gap-3 mb-4">
        <input
          className="border p-3 rounded w-full"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="border p-3 rounded"
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
        >
          <option value="all">All Projects</option>
          <option value="none">General Documents</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= LIST ================= */}

      <div className="bg-white p-6 rounded-xl border">
        {filteredDocuments.length === 0 && (
          <p>No documents found</p>
        )}

        {filteredDocuments.map(d => (
          <div
            key={d.id}
            className="p-4 border rounded flex justify-between items-center mb-3"
          >
            <div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-sm text-gray-600">
                {d.projectName ?? "General Document"}
              </p>
              <p className="text-xs">{d.fileName}</p>
            </div>

            <div className="flex gap-2">
              <a
                href={d.url}
                target="_blank"
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                View
              </a>

              <button
                onClick={() => deleteDocument(d)}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
