"use client";

import { useState } from "react";

export default function ExpenseForm({ projects = [], units = [], onSubmit }: any) {
  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const YEARS = Array.from({ length: 6 }, (_, i) => 2023 + i);

  const handleSubmit = () => {
    if (!projectId || !month || !year || !title || !amount) {
      alert("Please fill required fields");
      return;
    }

    onSubmit?.({
      projectId,
      unitId: unitId || null,
      month,
      year,
      title,
      amount: Number(amount),
    });

    setTitle("");
    setAmount("");
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-900">
        Add Expense
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Project *</option>
          {projects.map((p:any)=>(
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">All Units (Optional)</option>
          {units.map((u:any)=>(
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Month *</option>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>

        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Year *</option>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>

        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Expense Title *"
          className="border rounded px-3 py-2 text-black"
        />

        <input
          type="number"
          value={amount}
          onChange={e=>setAmount(e.target.value)}
          placeholder="Amount *"
          className="border rounded px-3 py-2 text-black"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Save Expense
      </button>
    </div>
  );
}
