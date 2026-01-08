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
  const [otherIncome, setOtherIncome] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [year, setYear] = useState("");

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 2023 + 3 }, (_, i) => 2023 + i);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      const [
        p,
        u,
        pay,
        other,
        profit,
        mem
      ] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "units")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "projectOtherPayments")),
        getDocs(collection(db, "projectProfits")),
        getDocs(collection(db, "members")),
      ]);

      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setUnits(u.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
      setOtherIncome(other.docs.map(d => ({ id: d.id, ...d.data() })));
      setProfits(profit.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(mem.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    load();
  }, []);

  /* ================= FORMAT INR ================= */
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  /* ================= FILTER ================= */
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

  const yearlyPayments = payments.filter(filterMatch);
  const yearlyExpenses = expenses.filter(filterMatch);
  const yearlyOtherIncome = otherIncome.filter(filterMatch);
  const yearlyProfits = profits.filter(filterMatch);

  /* ================= QUIT MEMBER REFUND ================= */
  const quitMemberIds = members
    .filter(m => m.status === "quit" && m.quitProjectId === projectId)
    .map(m => m.id);

  const quitRefund = yearlyPayments
    .filter(p => quitMemberIds.includes(p.memberId))
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  /* ================= TOTALS ================= */
  const totalMemberIncome = yearlyPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  const totalOtherIncome = yearlyOtherIncome.reduce(
    (s, o) => s + Number(o.amount || 0),
    0
  );

  const totalProfit = yearlyProfits.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  const totalExpense = yearlyExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const totalIncome =
    totalMemberIncome + totalOtherIncome + totalProfit;

  const balance =
    totalIncome - totalExpense - quitRefund;

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
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border px-3 py-2">
          <option value="">Select Project</option>
          {projects.map(p=>(
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={unitId} onChange={e=>setUnitId(e.target.value)} className="border px-3 py-2">
          <option value="">All Units</option>
          {units.map(u=>(
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select value={year} onChange={e=>setYear(e.target.value)} className="border px-3 py-2">
          <option value="">Select Year</option>
          {YEARS.map(y=>(
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        <Card title="Member Income" value={totalMemberIncome} green />
        <Card title="Other Income" value={totalOtherIncome} green />
        <Card title="Profit" value={totalProfit} green />
        <Card title="Quit Refund" value={quitRefund} red />
        <Card
          title="Net Balance"
          value={balance}
          green={balance >= 0}
          red={balance < 0}
        />

      </div>

    </div>
  );
}

/* ================= CARD ================= */

function Card({ title, value, green, red }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <h2
        className={`text-2xl font-bold ${
          green ? "text-green-700" : red ? "text-red-700" : ""
        }`}
      >
        ₹{new Intl.NumberFormat("en-IN").format(value)}
      </h2>
    </div>
  );
}
