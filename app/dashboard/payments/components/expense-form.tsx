"use client";

import { useEffect, useState } from "react";

export default function ExpenseForm({
  projects,
  onSubmit,
  defaultValues,
  onCancel
}: any) {

  const [projectId, setProjectId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const YEARS = Array.from({ length: 6 }, (_, i) => 2023 + i);

  // ================= PREFILL FOR EDIT =================
  useEffect(() => {
    if (defaultValues) {
      setProjectId(defaultValues.projectId || "");
      setMonth(defaultValues.month || "");
      setYear(defaultValues.year || "");
      setTitle(defaultValues.title || "");
      setAmount(String(defaultValues.amount || ""));
    }
  }, [defaultValues]);

  // ================= SUBMIT =================
  const handleSubmit = () => {
    if (!projectId || !month || !year || !title || !amount) return;

    onSubmit({
      projectId,
      projectName:
        projects.find((p:any)=>p.id === projectId)?.name || "",
      month,
      year,
      title,
      amount: Number(amount),
    });

    // reset only when adding
    if (!defaultValues) {
      setProjectId("");
      setMonth("");
      setYear("");
      setTitle("");
      setAmount("");
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">

      <h2 className="text-lg font-semibold mb-3 text-black">
        {defaultValues ? "Edit Expense" : "Add Expense"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Project</option>
          {projects.map((p:any)=>(
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Month</option>
          {MONTHS.map(m=>(
            <option key={m}>{m}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Year</option>
          {YEARS.map(y=>(
            <option key={y}>{y}</option>
          ))}
        </select>

        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Expense Title"
          className="border rounded px-3 py-2 text-black"
        />
      </div>

      <input
        value={amount}
        onChange={e=>setAmount(e.target.value)}
        placeholder="Amount"
        className="border rounded px-3 py-2 text-black mt-3 w-full md:w-1/3"
      />

      <div className="flex gap-3 mt-4">

        <button
          onClick={handleSubmit}
          className={`px-4 py-2 text-white rounded-lg ${
            defaultValues ? "bg-blue-600" : "bg-red-600"
          }`}
        >
          {defaultValues ? "Update Expense" : "Save Expense"}
        </button>

        {defaultValues && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-black"
          >
            Cancel
          </button>
        )}

      </div>

    </div>
  );
}
