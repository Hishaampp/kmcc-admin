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

const formatINR = (num:number) =>
  new Intl.NumberFormat("en-IN").format(num || 0);

export default function ExpensesPage() {
  const router = useRouter();

  const { loading, projects } = usePayments();
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpenseById
  } = useExpenses();

  const [search, setSearch] = useState("");
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p>Loading...</p>
      </div>
    );
  }

  // ================= SORT =================
  const sortedExpenses = [...expenses].sort((a:any,b:any)=>{
    const yA = Number(a.year) || 0;
    const yB = Number(b.year) || 0;
    if(yA !== yB) return yB - yA;

    const mA = MONTHS.indexOf(a.month);
    const mB = MONTHS.indexOf(b.month);
    if(mA !== mB) return mB - mA;

    const tA = a.createdAt?.toMillis?.() || 0;
    const tB = b.createdAt?.toMillis?.() || 0;
    return tB - tA;
  });

  // ================= SEARCH =================
  const filteredExpenses = sortedExpenses.filter((e:any)=>{
    if(!search.trim()) return true;
    const k = search.toLowerCase();

    return [
      e.title,
      e.projectName,
      e.month,
      e.year,
      e.amount
    ].join(" ").toLowerCase().includes(k);
  });

  // ================= HANDLERS =================
  const handleSubmit = async (data:any) => {
    if(editingExpense){
      await updateExpense(editingExpense.id, data);
      setEditingExpense(null);
    } else {
      await addExpense(data);
    }
  };

  const handleDelete = async (id:string) => {
    const ok = confirm("Are you sure you want to delete this expense?");
    if(ok) await deleteExpenseById(id);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {editingExpense ? "Edit Expense" : "Add Expense"}
      </h1>

      {/* FORM */}
      <ExpenseForm
        projects={projects}
        onSubmit={handleSubmit}
        defaultValues={editingExpense}
        onCancel={() => setEditingExpense(null)}
      />

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <input
          placeholder="Search expenses"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">
          Expense Records
        </h2>

        {filteredExpenses.length === 0 && (
          <p>No expenses found.</p>
        )}

        <ul className="space-y-2">
          {filteredExpenses.map((e:any)=>(
            <li
              key={e.id}
              className="p-3 border rounded bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {e.title}
                </p>
                <p className="text-sm">
                  {e.projectName || "No Project"} — {e.month} {e.year}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-red-700">
                  ₹{formatINR(e.amount)}
                </span>

                <button
                  onClick={() => setEditingExpense(e)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(e.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
