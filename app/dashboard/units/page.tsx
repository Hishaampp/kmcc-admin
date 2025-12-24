"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function UnitsPage() {
  const [unitName, setUnitName] = useState("");
  const [units, setUnits] = useState<any[]>([]);

  // Fetch Units
  const fetchUnits = async () => {
    const querySnapshot = await getDocs(collection(db, "units"));
    const list: any[] = [];
    querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setUnits(list);
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Add Unit
  const addUnit = async () => {
    if (!unitName.trim()) return;
    await addDoc(collection(db, "units"), {
      name: unitName,
      createdAt: serverTimestamp(),
    });

    setUnitName("");
    fetchUnits();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Manage Units</h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-3">
        <input
  value={unitName}
  onChange={(e) => setUnitName(e.target.value)}
  placeholder="Enter Unit Name"
  className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
/>

        <button
          onClick={addUnit}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">All Units</h2>

        {units.length === 0 && (
          <p className="text-gray-600">No units added yet.</p>
        )}

        <ul className="space-y-2">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="p-3 border rounded-lg bg-gray-50 flex justify-between"
            >
              <span className="font-medium text-gray-900">{unit.name}</span>
              <span className="text-sm text-gray-600">
                {unit.createdAt?.toDate
                  ? unit.createdAt.toDate().toLocaleDateString()
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
