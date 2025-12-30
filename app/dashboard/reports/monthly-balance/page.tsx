"use client";

import useExpenses from "@/app/dashboard/payments/hooks/use-expenses";
import usePayments from "@/app/dashboard/payments/hooks/use-payments";
import { useState } from "react";

export default function MonthlyBalanceReport() {
  const { projects, units, payments } = usePayments();
  const { expenses } = useExpenses();

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const YEARS = Array.from({ length: 6 }, (_, i) => 2023 + i);

  const filterMatch = (item:any) => {
    if (projectId && item.projectId !== projectId) return false;
    if (unitId && item.unitId !== unitId) return false;
    if (month && item.month !== month) return false;
    if (year && String(item.year) !== String(year)) return false;
    return true;
  };

  const income = payments.filter(filterMatch);
  const expense = expenses.filter(filterMatch);

  const totalIncome = income.reduce((s,p)=>s+Number(p.amount||0),0);
  const totalExpense = expense.reduce((s,e)=>s+Number(e.amount||0),0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* Title */}
      <h1 className="text-3xl font-bold mb-1">
        Monthly Balance Sheet
      </h1>
      <p className="text-gray-700 mb-6">
        View project wise monthly financial summary.
      </p>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <select value={projectId} onChange={e=>setProjectId(e.target.value)}
            className="border rounded px-3 py-2 text-black">
            <option value="">Select Project</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select value={unitId} onChange={e=>setUnitId(e.target.value)}
            className="border rounded px-3 py-2 text-black">
            <option value="">All Units</option>
            {units.map(u=>(
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select value={month} onChange={e=>setMonth(e.target.value)}
            className="border rounded px-3 py-2 text-black">
            <option value="">Select Month</option>
            {MONTHS.map(m=>(
              <option key={m}>{m}</option>
            ))}
          </select>

          <select value={year} onChange={e=>setYear(e.target.value)}
            className="border rounded px-3 py-2 text-black">
            <option value="">Select Year</option>
            {YEARS.map(y=>(
              <option key={y}>{y}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <div className="bg-white p-6 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Total Income</p>
          <h2 className="text-3xl font-bold text-green-700 mt-1">
            ₹{totalIncome}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Total Expense</p>
          <h2 className="text-3xl font-bold text-red-700 mt-1">
            ₹{totalExpense}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Net Balance</p>
          <h2 className={`text-3xl font-bold mt-1 ${balance >= 0 ? "text-green-700":"text-red-700"}`}>
            ₹{balance}
          </h2>
        </div>

      </div>

      {/* Income Table */}
      <div className="bg-white p-5 rounded-xl border shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Income Records</h2>

        {income.length === 0 && (
          <p className="text-gray-700">No income records found.</p>
        )}

        {income.length > 0 && (
          <ul className="divide-y">
            {income.map((p:any)=>(
              <li key={p.id} className="py-2 flex justify-between">
                <span>{p.memberName} — {p.unitName}</span>
                <span className="font-bold text-green-700">₹{p.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expense Table */}
      <div className="bg-white p-5 rounded-xl border shadow">
        <h2 className="text-lg font-semibold mb-3">Expense Records</h2>

        {expense.length === 0 && (
          <p className="text-gray-700">No expense records found.</p>
        )}

        {expense.length > 0 && (
          <ul className="divide-y">
            {expense.map((e:any)=>(
              <li key={e.id} className="py-2 flex justify-between">
                <span>{e.title} — {e.unitName || "All Units"}</span>
                <span className="font-bold text-red-700">₹{e.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
