"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { logAuditEvent } from "@/lib/auditLog";

/* ================= UTILS ================= */
const money = (n:number) =>
  new Intl.NumberFormat("en-IN").format(Number(n || 0));

/* ================= COMPONENT ================= */
export default function AssetManagementPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  /* ================= LOAD ================= */
  const load = async () => {
    const p = await getDocs(collection(db, "projects"));
    setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));

    const a = await getDocs(collection(db, "projectAssets"));
    setAssets(a.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setEditingId(null);
    setProjectId("");
    setTitle("");
    setValue("");
    setNote("");
  };

  /* ================= ADD / UPDATE ================= */
  const saveAsset = async () => {
    if (!projectId || !title.trim() || !value.trim()) return;

    const project = projects.find(p => p.id === projectId);

    const payload = {
      projectId,
      projectName: project?.name || "",
      title,
      value: Number(value),
      note,
    };

    if (editingId) {
      // Find old record for audit comparison
      const oldAsset = assets.find(a => a.id === editingId);

      await updateDoc(doc(db, "projectAssets", editingId), payload);

      // Log audit for edit
      await logAuditEvent({
        action: "asset_edited",
        collectionName: "projectAssets",
        documentId: editingId,
        details: {
          projectName: project?.name || "",
          assetTitle: title,
          assetValue: Number(value),
          note: note || "No note",
          oldValue: oldAsset?.value,
          oldTitle: oldAsset?.title
        }
      });
    } else {
      const newAssetRef = await addDoc(collection(db, "projectAssets"), {
        ...payload,
        createdAt: serverTimestamp(),
      });

      // Log audit for add
      await logAuditEvent({
        action: "asset_added",
        collectionName: "projectAssets",
        documentId: newAssetRef.id,
        details: {
          projectName: project?.name || "",
          assetTitle: title,
          assetValue: Number(value),
          note: note || "No note"
        }
      });
    }

    resetForm();
    load();
  };

  /* ================= EDIT ================= */
  const editAsset = (asset: any) => {
    setEditingId(asset.id);
    setProjectId(asset.projectId);
    setTitle(asset.title);
    setValue(String(asset.value));
    setNote(asset.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= DELETE ================= */
  const deleteAsset = async (id: string) => {
    const asset = assets.find(a => a.id === id);
    const ok = confirm("Are you sure you want to delete this asset?");
    if (!ok) return;

    await deleteDoc(doc(db, "projectAssets", id));

    // Log audit for delete
    await logAuditEvent({
      action: "asset_deleted",
      collectionName: "projectAssets",
      documentId: id,
      details: {
        projectName: asset?.projectName || "Unknown",
        assetTitle: asset?.title || "Unknown",
        assetValue: asset?.value || 0,
        note: asset?.note || "No note"
      }
    });

    load();
  };

  /* ================= FILTER ================= */
  const filtered = assets.filter(a => {
    if (projectId && a.projectId !== projectId) return false;

    if (search.trim()) {
      const k = search.toLowerCase();
      const text = [
        a.title,
        a.projectName,
        a.note,
        a.value ? String(a.value) : ""
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(k);
    }

    return true;
  });

  const totalValue = filtered.reduce(
    (s,a)=>s+Number(a.value||0),0
  );

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Project Assets
      </h1>

      {/* ADD/EDIT ASSET */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">
          {editingId ? "Edit Asset" : "Add Asset"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={projectId}
            onChange={e=>setProjectId(e.target.value)}
            className="border rounded px-3 py-2 text-black"
          >
            <option value="">Select Project</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Asset Title (Land, Building, Vehicle)"
            className="border rounded px-3 py-2 text-black"
          />

          <input
            value={value}
            onChange={e=>setValue(e.target.value)}
            placeholder="Asset Value"
            className="border rounded px-3 py-2 text-black"
          />

          <input
            value={note}
            onChange={e=>setNote(e.target.value)}
            placeholder="Note (optional)"
            className="border rounded px-3 py-2 text-black"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={saveAsset}
            className={`px-4 py-2 text-white rounded ${
              editingId ? "bg-blue-600" : "bg-green-600"
            }`}
          >
            {editingId ? "Update Asset" : "Save Asset"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <input
          placeholder="Search asset / project / value"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full text-black"
        />
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <p className="text-sm">Total Asset Value</p>
        <h2 className="text-2xl font-bold text-green-700">
          ₹{money(totalValue)}
        </h2>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">
          Assets List
        </h2>

        {filtered.length === 0 && (
          <p className="text-gray-700">No assets found.</p>
        )}

        <ul className="space-y-2">
          {filtered.map(a=>(
            <li
              key={a.id}
              className="p-3 border rounded bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-black">
                  {a.title}
                </p>
                <p className="text-sm text-black">
                  {a.projectName}
                </p>
                {a.note && (
                  <p className="text-xs text-gray-600">
                    {a.note}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-green-700">
                  ₹{money(a.value)}
                </span>

                <button
                  onClick={() => editAsset(a)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteAsset(a.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}