"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function MonthlyPaymentsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 2023 + 3 }, (_, i) => 2023 + i);

  // Fetch Projects
  const fetchProjects = async () => {
    const s = await getDocs(collection(db, "projects"));
    setProjects(s.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Fetch Units
  const fetchUnits = async () => {
    const s = await getDocs(collection(db, "units"));
    setUnits(s.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Fetch Members
  const fetchMembers = async () => {
    const s = await getDocs(collection(db, "members"));
    setMembers(s.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Fetch Payments
  const fetchPayments = async () => {
    const s = await getDocs(collection(db, "payments"));
    setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchProjects();
    fetchUnits();
    fetchMembers();
    fetchPayments();
  }, []);

  // 🔥 Convert ANY month text → 0-11 index
  const getMonthIndex = (value: string) => {
    if (!value) return null;

    const clean = value.trim().toLowerCase();

    const months = [
      "january","february","march","april","may","june",
      "july","august","september","october","november","december"
    ];

    // Case → "June", "June 2024", "june paid"
    for (let i = 0; i < months.length; i++) {
      if (clean.includes(months[i])) return i;
    }

    // Case → "06" or "6"
    const num = parseInt(clean);
    if (!isNaN(num) && num >= 1 && num <= 12) return num - 1;

    return null;
  };

  const selectedMonthIndex = getMonthIndex(month);

  // FILTER PAYMENTS
  const filteredPayments = payments.filter(p => {
    if (!month || !year || !projectId) return false;

    const paymentMonthIndex = getMonthIndex(p.month);
    const matchesMonth = paymentMonthIndex === selectedMonthIndex;

    const savedYear =
      p.year
        ? Number(p.year)
        : p.createdAt?.toDate
        ? p.createdAt.toDate().getFullYear()
        : null;

    const matchesYear = savedYear == Number(year);
    const matchesProject = p.projectId === projectId;
    const matchesUnit = unitId ? p.unitId === unitId : true;

    return matchesMonth && matchesYear && matchesProject && matchesUnit;
  });

  const paidMemberIds = new Set(filteredPayments.map(p => p.memberId));

  const relevantMembers = members.filter(m => {
    if (!projectId) return false;
    if (m.status === "quit") return false;
    if (unitId && m.unitId !== unitId) return false;
    return true;
  });

  const pendingMembers = relevantMembers.filter(m => !paidMemberIds.has(m.id));

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Monthly Payments Report
      </h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">

        {/* Project */}
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

        {/* Unit */}
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

        {/* Month */}
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border rounded px-3 py-2 text-gray-900"
        >
          <option value="">Select Month</option>
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="border rounded px-3 py-2 text-gray-900"
        >
          <option value="">Select Year</option>
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Total Collected</p>
          <h2 className="text-2xl font-bold text-green-700">
            ₹{totalAmount}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Payments Recorded</p>
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredPayments.length}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Members Paid</p>
          <h2 className="text-2xl font-bold text-green-700">
            {paidMemberIds.size}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Pending Members</p>
          <h2 className="text-2xl font-bold text-red-700">
            {pendingMembers.length}
          </h2>
        </div>

      </div>

      {/* Paid List */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Paid Members
        </h2>

        {filteredPayments.length === 0 && (
          <p className="text-gray-600">No payments found.</p>
        )}

        <ul className="space-y-2">
          {filteredPayments.map(p => (
            <li key={p.id} className="p-3 border rounded bg-gray-50 flex justify-between">
              <span className="font-medium text-gray-900">
                {p.memberName} ({p.memberNumber})
              </span>
              <span className="text-green-700 font-bold">
                ₹{p.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pending List */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Pending Members
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
              <span className="text-red-700 font-bold">
                Pending
              </span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
