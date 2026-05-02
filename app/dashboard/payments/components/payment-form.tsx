"use client";

import { useState } from "react";

export default function PaymentForm({
  projects,
  units,
  members,
  onSubmit,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  selectedProjectId,
  selectedUnitId,
  onProjectChange,
  onUnitChange,
}: any) {
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const YEARS = Array.from(
    { length: 2050 - 2023 + 1 },
    (_, i) => 2023 + i
  );

  const filteredMembers = members.filter((m: any) =>
    selectedUnitId ? m.unitId === selectedUnitId && m.status !== "quit" : false
  );

  const handleSubmit = () => {
    if (!selectedProjectId || !selectedUnitId || !memberId || !selectedMonth || !selectedYear || !amount) return;

    onSubmit({
      projectId: selectedProjectId,
      unitId: selectedUnitId,
      memberId,
      month: selectedMonth,
      year: selectedYear,
      amount,
    });

    // ✅ Only member and amount reset — project, unit, month, year stay constant
    setMemberId("");
    setAmount("");
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">

      <h2 className="text-lg font-semibold mb-3 text-gray-900">
        Add Payment
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

        {/* ✅ Controlled by parent */}
        <select
          value={selectedProjectId}
          onChange={e => onProjectChange(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Project</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* ✅ Controlled by parent */}
        <select
          value={selectedUnitId}
          onChange={e => onUnitChange(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Unit</option>
          {units.map((u: any) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={memberId}
          onChange={e => setMemberId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Member</option>
          {filteredMembers.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.number} - {m.name}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={e => onMonthChange(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Month</option>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>

        <select
          value={selectedYear}
          onChange={e => onYearChange(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Year</option>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>

        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
          className="border rounded px-3 py-2 text-black"
        />

      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
      >
        Save Payment
      </button>
    </div>
  );
}