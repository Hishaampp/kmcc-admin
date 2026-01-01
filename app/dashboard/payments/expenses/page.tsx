"use client";

import { useRouter } from "next/navigation";
import usePayments from "../hooks/use-payments";
import useExpenses from "../hooks/use-expenses";
import ExpenseForm from "../components/expense-form";
import { useState } from "react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// INDIAN RUPEE FORMATTER
const formatINR = (num:number) =>
  new Intl.NumberFormat("en-IN").format(num);

export default function ExpensesPage() {
  const router = useRouter();

  const { loading, projects } = usePayments();
  const { addExpense, expenses } = useExpenses();

  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p>Loading...</p>
      </div>
    );
  }

  // SORT (Latest First)
  const sortedExpenses = [...expenses].sort((a:any,b:any)=>{

    const yearA = Number(a.year) || 0;
    const yearB = Number(b.year) || 0;
    if(yearA !== yearB) return yearB - yearA;

    const monthA = MONTHS.indexOf(a.month);
    const monthB = MONTHS.indexOf(b.month);
    if(monthA !== monthB) return monthB - monthA;

    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  // SEARCH
  const filteredExpenses = sortedExpenses.filter((e:any)=>{
    if(!search.trim()) return true;

    const keyword = search.toLowerCase();

    const fields = [
      e.title,
      e.projectName,
      e.month,
      e.year ? String(e.year) : "",
      e.amount ? String(e.amount) : ""
    ];

    return fields.some(f =>
      (f || "").toString().toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Add Expenses
      </h1>

      {/* ADD FORM */}
      <ExpenseForm
        projects={projects}
        onSubmit={addExpense}
      />

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <input
          placeholder="Search by Title / Project / Month / Year / Amount"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full text-black placeholder-gray-700"
        />
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">
          Expense Records
        </h2>

        {filteredExpenses.length === 0 && (
          <p className="text-gray-600">No expenses found.</p>
        )}

        <ul className="space-y-2">
          {filteredExpenses.map((e:any)=>(
            <li
              key={e.id}
              className="p-3 border rounded bg-gray-50 flex justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {e.title}
                </p>

                <p className="text-sm text-gray-700">
                  {e.projectName || "No Project"} — {e.month} {e.year}
                </p>
              </div>

              <span className="font-bold text-red-700">
                ₹{formatINR(Number(e.amount || 0))}
              </span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
