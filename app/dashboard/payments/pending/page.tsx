"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function PendingPaymentsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");

  const fetch = async () => {
    const p = await getDocs(collection(db, "projects"));
    setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));

    const u = await getDocs(collection(db, "units"));
    setUnits(u.docs.map(d => ({ id: d.id, ...d.data() })));

    const m = await getDocs(collection(db, "members"));
    setMembers(m.docs.map(d => ({ id: d.id, ...d.data() })));

    const pay = await getDocs(collection(db, "payments"));
    setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetch();
  }, []);

  const paidMemberIds = new Set(payments.map(p => p.memberId));

  const relevantMembers = members.filter(m => {
    if (!projectId) return false;
    if (m.status === "quit") return false;
    if (unitId && m.unitId !== unitId) return false;
    return true;
  });

  const pendingMembers = relevantMembers.filter(m => !paidMemberIds.has(m.id));

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Pending Payments
      </h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2 text-gray-900"
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          className="border rounded px-3 py-2 text-gray-900"
        >
          <option value="">All Units</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

      </div>

      {/* Pending Members */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Pending Members ({pendingMembers.length})
        </h2>

        {pendingMembers.length === 0 && (
          <p className="text-gray-600">No pending members.</p>
        )}

        <ul className="space-y-2">
          {pendingMembers.map(m => (
            <li key={m.id} className="p-3 border rounded bg-red-50 flex justify-between">
              <span className="font-medium text-gray-900">
                {m.name} ({m.number})
              </span>
              <span className="text-red-700 font-bold">Pending</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
