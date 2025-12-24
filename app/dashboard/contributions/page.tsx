"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function PaymentsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");

  const [search, setSearch] = useState("");

  // Fetch Data
  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchPayments = async () => {
    const snap = await getDocs(collection(db, "payments"));
    setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchProjects();
    fetchUnits();
    fetchMembers();
    fetchPayments();
  }, []);

  // Filter ONLY ACTIVE members of selected unit
  const filteredMembers = unitId
    ? members.filter((m) => m.unitId === unitId && m.status !== "quit")
    : [];

  // Add Payment
  const addPayment = async () => {
    if (!projectId || !unitId || !memberId || !month || !amount) return;

    const project = projects.find((p) => p.id === projectId);
    const unit = units.find((u) => u.id === unitId);
    const member = members.find((m) => m.id === memberId);

    // Additional Protection: Block Quit Member Attempt
    if (member?.status === "quit") {
      alert("This member has quit. Payments are not allowed.");
      return;
    }

    await addDoc(collection(db, "payments"), {
      projectId,
      projectName: project?.name,
      unitId,
      unitName: unit?.name,
      memberId,
      memberName: member?.name,
      memberNumber: member?.number,
      month,
      amount,
      createdAt: serverTimestamp(),
    });

    setMonth("");
    setAmount("");
    fetchPayments();
  };

  // Search
  const filteredPayments = payments.filter((p) => {
    return (
      p.memberName?.toLowerCase().includes(search.toLowerCase()) ||
      p.memberNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.unitName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Record Payments
      </h1>

      {/* Add Payment Form */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">

        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Add New Payment
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Project */}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="border rounded px-3 py-2 w-full text-gray-900"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Unit */}
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="border rounded px-3 py-2 w-full text-gray-900"
          >
            <option value="">Select Unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Member */}
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="border rounded px-3 py-2 w-full text-gray-900"
          >
            <option value="">Select Member</option>

            {filteredMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.number} - {m.name}
              </option>
            ))}
          </select>

          {/* Month */}
          <input
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="Month (e.g., January)"
            className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
          />

          {/* Amount */}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
          />
        </div>

        <button
          onClick={addPayment}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Payment
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <input
          placeholder="Search by name, number, or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
        />
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl border shadow-sm p-4">

        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Payments History
        </h2>

        {filteredPayments.length === 0 && (
          <p className="text-gray-600">No payments recorded yet.</p>
        )}

        <ul className="space-y-2">
          {filteredPayments.map((p) => (
            <li
              key={p.id}
              className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {p.memberName} ({p.memberNumber})
                </p>
                <p className="text-sm text-gray-600">
                  {p.unitName} — {p.month}
                </p>
              </div>

              <span className="font-bold text-green-700">
                ₹{p.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
