"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import usePayments from "@/app/dashboard/payments/hooks/use-payments";
import useExpenses from "@/app/dashboard/payments/hooks/use-expenses";

export default function MonthlyBalanceReport() {
  const { projects, units, payments } = usePayments();
  const { expenses } = useExpenses();

  const [otherPayments, setOtherPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [view, setView] = useState<
    "overview" | "unit" | "member" | "other" | "expense"
  >("overview");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const YEARS = Array.from({ length: 6 }, (_, i) => 2023 + i);

  // ================= LOAD OTHER PAYMENTS =================
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "projectOtherPayments"));
      setOtherPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  // ================= FILTER =================
  const match = (i: any) => {
    if (projectId && i.projectId !== projectId) return false;
    if (unitId && i.unitId !== unitId) return false;
    if (month && i.month !== month) return false;
    if (year && String(i.year) !== String(year)) return false;
    return true;
  };

  const memberIncome = payments.filter(match);
  const expense = expenses.filter(match);
  const otherIncome = otherPayments.filter(match);

  // ================= FORMAT ₹ =================
  const f = (n: number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  // ================= UNIT WISE =================
  const unitWiseIncome = useMemo(() => {
    const map: any = {};
    memberIncome.forEach((p: any) => {
      if (!p.unitId) return;
      if (!map[p.unitId]) {
        map[p.unitId] = {
          name: p.unitName || "Unknown Unit",
          total: 0,
        };
      }
      map[p.unitId].total += Number(p.amount || 0);
    });
    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  }, [memberIncome]);

  // ================= TOTALS =================
  const totalMemberIncome = memberIncome.reduce(
    (s, p) => s + Number(p.amount || 0), 0
  );

  const totalOtherIncome = otherIncome.reduce(
    (s, p) => s + Number(p.amount || 0), 0
  );

  const totalExpense = expense.reduce(
    (s, e) => s + Number(e.amount || 0), 0
  );

  const totalIncome = totalMemberIncome + totalOtherIncome;
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-1">Monthly Balance Sheet</h1>
      <p className="text-gray-700 mb-6">
        Complete financial overview (project / unit / member)
      </p>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border px-3 py-2">
          <option value="">All Projects</option>
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

        <select value={month} onChange={e=>setMonth(e.target.value)} className="border px-3 py-2">
          <option value="">All Months</option>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>

        <select value={year} onChange={e=>setYear(e.target.value)} className="border px-3 py-2">
          <option value="">All Years</option>
          {YEARS.map(y=><option key={y}>{y}</option>)}
        </select>
      </div>

      {/* VIEW SELECTOR */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-6 flex flex-wrap gap-2">
        {[
          ["overview","Overview"],
          ["unit","Unit Income"],
          ["member","Member Payments"],
          ["other","Other Income"],
          ["expense","Expenses"],
        ].map(([id,label])=>(
          <button
            key={id}
            onClick={()=>setView(id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              ${view===id ? "bg-black text-white":"bg-gray-100 hover:bg-gray-200"}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {view==="overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card title="Total Income" value={`₹${f(totalIncome)}`} green />
          <Card title="Total Expense" value={`₹${f(totalExpense)}`} red />
          <Card
            title="Net Balance"
            value={`₹${f(balance)}`}
            green={balance >= 0}
            red={balance < 0}
          />
        </div>
      )}

      {/* UNIT WISE */}
      {view==="unit" && (
        <List title="Unit Wise Income" data={unitWiseIncome} f={f} />
      )}

      {/* MEMBER WISE */}
      {view==="member" && (
        <List
          title="Member Payments"
          data={memberIncome.map((p:any)=>({
            name: `${p.memberName} (${p.unitName})`,
            total: p.amount
          }))}
          f={f}
        />
      )}

      {/* OTHER INCOME */}
      {view==="other" && (
        <List
          title="Other Income"
          data={otherIncome.map((o:any)=>({
            name: o.title,
            total: o.amount
          }))}
          f={f}
        />
      )}

      {/* EXPENSE */}
      {view==="expense" && (
        <List
          title="Expenses"
          data={expense.map((e:any)=>({
            name: e.title,
            total: e.amount
          }))}
          f={f}
          red
        />
      )}

    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Card({ title, value, green, red }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <h2 className={`text-3xl font-bold ${green ? "text-green-700" : red ? "text-red-700" : ""}`}>
        {value}
      </h2>
    </div>
  );
}

function List({ title, data, f, red }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-900">
        {title}
      </h2>

      {data.length === 0 && (
        <p className="text-gray-700">No records found.</p>
      )}

      <ul className="divide-y">
        {data.map((i:any, idx:number)=>(
          <li key={idx} className="py-2 flex justify-between items-center">
            <span className="text-gray-900 font-medium">
              {i.name}
            </span>
            <span className={`font-bold ${red ? "text-red-700" : "text-green-700"}`}>
              ₹{f(i.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
