"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import useExpenses from "@/app/dashboard/payments/hooks/use-expenses";

export default function YearlyPaymentsPage() {
  const router = useRouter();
  const { expenses } = useExpenses();

  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [year, setYear] = useState("");

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from(
    { length: currentYear - 2023 + 3 },
    (_, i) => 2023 + i
  );

  // ================= LOAD DATA =================
  useEffect(() => {
    const load = async () => {
      const p = await getDocs(collection(db, "projects"));
      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));

      const u = await getDocs(collection(db, "units"));
      setUnits(u.docs.map(d => ({ id: d.id, ...d.data() })));

      const pay = await getDocs(collection(db, "payments"));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    load();
  }, []);

  // ================= FORMAT INR =================
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  // ================= FILTER =================
  const filterMatch = (item: any) => {
    if (!projectId || !year) return false;
    if (item.projectId !== projectId) return false;

    const itemYear =
      item.year
        ? Number(item.year)
        : item.createdAt?.toDate
        ? item.createdAt.toDate().getFullYear()
        : null;

    if (itemYear !== Number(year)) return false;
    if (unitId && item.unitId !== unitId) return false;

    return true;
  };

  const yearlyIncome = payments.filter(filterMatch);
  const yearlyExpenses = expenses.filter(filterMatch);

  // ================= TOTALS =================
  const totalIncome = yearlyIncome.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  const totalExpense = yearlyExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Yearly Financial Overview
      </h1>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">All Units</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">Select Year</option>
          {YEARS.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Total Income</p>
          <h2 className="text-2xl font-bold text-green-700">
            ₹{formatINR(totalIncome)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Total Expense</p>
          <h2 className="text-2xl font-bold text-red-700">
            ₹{formatINR(totalExpense)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm text-gray-600">Net Balance</p>
          <h2
            className={`text-2xl font-bold ${
              balance >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            ₹{formatINR(balance)}
          </h2>
        </div>

      </div>

    </div>
  );
}
