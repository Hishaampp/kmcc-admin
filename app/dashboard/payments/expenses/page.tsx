"use client";

import { useRouter } from "next/navigation";
import usePayments from "../hooks/use-payments";
import useExpenses from "../hooks/use-expenses";
import ExpenseForm from "../components/expense-form";


export default function ExpensesPage() {
  const router = useRouter();

  const {
    loading,
    projects,
    units,
  } = usePayments();

  const { addExpense } = useExpenses();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Add Expenses
      </h1>

      <ExpenseForm
        projects={projects}
        units={units}
        onSubmit={addExpense}
      />
    </div>
  );
}
