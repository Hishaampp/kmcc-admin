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

type DocumentItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  storagePath: string;
  url: string;
  fileSize: number;
  fileType: string;
};

export default function DocumentsPage() {
  const [user, setUser] = useState<any>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadDocs();
    });
    return () => unsub();
  }, []);

  const loadDocs = async () => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
  };

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
      (snap) =>
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);

        await addDoc(collection(db, "documents"), {
          title,
          description,
          category,
          fileName: file.name,
          storagePath,
          url,
          fileSize: file.size,
          fileType: file.type,
          uploadedBy: user.email,
          createdAt: serverTimestamp(),
        });

        setTitle("");
        setDescription("");
        setCategory("");
        setFile(null);
        setUploading(false);
        setProgress(0);
        loadDocs();
      }
    );
  };

  const deleteDocument = async (d: DocumentItem) => {
    if (!confirm(`Delete "${d.title}"?`)) return;
    await deleteObject(ref(storage, d.storagePath));
    await deleteDoc(doc(db, "documents", d.id));
    loadDocs();
  };

  const filtered = docs.filter(d =>
    `${d.title} ${d.category} ${d.fileName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      <Link href="/dashboard" className="mb-4 inline-block px-4 py-2 bg-black text-white rounded">
        ← Dashboard Home
      </Link>

      <h1 className="text-3xl font-bold mb-6">Documents Vault</h1>

      <div className="bg-white p-6 rounded-xl border mb-6">
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <input className="border p-2 rounded" placeholder="Title"
            value={title} onChange={e => setTitle(e.target.value)} />

          <select className="border p-2 rounded"
            value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select Category</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <input className="border p-2 rounded" placeholder="Description"
            value={description} onChange={e => setDescription(e.target.value)} />

          <input type="file" className="border p-2 rounded"
            onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        <button
          onClick={uploadDocument}
          disabled={uploading}
          className={`px-6 py-2 rounded ${uploading ? "bg-gray-300" : "bg-green-600 text-white"}`}
        >
          {uploading ? `Uploading ${progress}%` : "Upload"}
        </button>
      </div>

      <input
        className="border p-3 rounded w-full mb-4"
        placeholder="Search documents..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="bg-white p-6 rounded-xl border">
        {filtered.length === 0 && <p>No documents found</p>}

        {filtered.map(d => (
          <div key={d.id} className="p-4 border rounded flex justify-between mb-3">
            <div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-sm">{d.fileName}</p>
            </div>
            <div className="flex gap-2">
              <a href={d.url} target="_blank" className="px-3 py-1 bg-blue-600 text-white rounded">
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
