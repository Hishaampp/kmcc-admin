"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { logAuditEvent } from "@/lib/auditLog";

export default function UnitsPage() {
  const router = useRouter();

  const [unitName, setUnitName] = useState("");
  const [units, setUnits] = useState<any[]>([]);

  const [showEditBox, setShowEditBox] = useState(false);
  const [editUnitId, setEditUnitId] = useState("");
  const [editUnitName, setEditUnitName] = useState("");
  const [editUnitOldName, setEditUnitOldName] = useState("");

  const [showDeleteBox, setShowDeleteBox] = useState(false);
  const [deleteUnitId, setDeleteUnitId] = useState("");
  const [deleteUnitName, setDeleteUnitName] = useState("");

  // ======================
  // SMART SORT FUNCTION
  // ======================
  const sortUnits = (list: any[]) => {
    return list.sort((a: any, b: any) => {
      const getNumber = (name: string) => {
        const match = name.match(/^\d+/);
        return match ? Number(match[0]) : Infinity;
      };

      const numA = getNumber(a.name);
      const numB = getNumber(b.name);

      if (numA !== numB) return numA - numB;

      return a.name.localeCompare(b.name);
    });
  };

  // ======================
  // FETCH UNITS
  // ======================
  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUnits(sortUnits(data));
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // ======================
  // ADD UNIT
  // ======================
  const addUnit = async () => {
    if (!unitName.trim()) return;

    const docRef = await addDoc(collection(db, "units"), {
      name: unitName,
      createdAt: serverTimestamp(),
    });

    // Log audit
    await logAuditEvent({
      action: "unit_added",
      collectionName: "units",
      documentId: docRef.id,
      details: { unitName }
    });

    setUnitName("");
    fetchUnits();
  };

  // ======================
  // EDIT UNIT
  // ======================
  const openEdit = (unit: any) => {
    setEditUnitId(unit.id);
    setEditUnitName(unit.name);
    setEditUnitOldName(unit.name);
    setShowEditBox(true);
  };

  const saveEdit = async () => {
    if (!editUnitName.trim()) return;

    await updateDoc(doc(db, "units", editUnitId), {
      name: editUnitName,
    });

    // Log audit
    await logAuditEvent({
      action: "unit_edited",
      collectionName: "units",
      documentId: editUnitId,
      details: { 
        oldName: editUnitOldName, 
        newName: editUnitName 
      }
    });

    setShowEditBox(false);
    fetchUnits();
  };

  // ======================
  // DELETE UNIT
  // ======================
  const openDelete = (unit: any) => {
    setDeleteUnitId(unit.id);
    setDeleteUnitName(unit.name);
    setShowDeleteBox(true);
  };

  const deleteUnit = async () => {
    await deleteDoc(doc(db, "units", deleteUnitId));

    // Log audit
    await logAuditEvent({
      action: "unit_deleted",
      collectionName: "units",
      documentId: deleteUnitId,
      details: { unitName: deleteUnitName }
    });

    setShowDeleteBox(false);
    fetchUnits();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded-lg hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Manage Units
      </h1>

      {/* ADD */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-3">
        <input
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          placeholder="Enter Unit Name (ex: 02-Cherukara)"
          className="border rounded px-3 py-2 w-full text-black placeholder-gray-800"
        />

        <button
          onClick={addUnit}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          All Units
        </h2>

        {units.length === 0 && (
          <p className="text-gray-600">No units added yet.</p>
        )}

        <ul className="space-y-2">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">{unit.name}</p>
                <p className="text-sm text-gray-600">
                  {unit.createdAt?.toDate
                    ? unit.createdAt.toDate().toLocaleDateString()
                    : ""}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(unit)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => openDelete(unit)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* EDIT POPUP */}
      {showEditBox && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[360px] shadow-lg text-gray-900">
            <h2 className="text-lg font-semibold mb-3">Edit Unit</h2>

            <input
              value={editUnitName}
              onChange={(e) => setEditUnitName(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-3 text-black"
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

      {/* DELETE POPUP */}
      {showDeleteBox && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[360px] shadow-lg text-gray-900">
            <h2 className="text-lg font-semibold mb-3 text-red-600">
              Delete Unit ?
            </h2>

            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this unit?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteBox(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={deleteUnit}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}