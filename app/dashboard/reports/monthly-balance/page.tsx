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
  const [profits, setProfits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [view, setView] = useState<
    "overview" | "unit" | "member" | "other" | "profit" | "quit" | "expense"
  >("overview");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const YEARS = Array.from({ length: 6 }, (_, i) => 2023 + i);

  /* ================= LOAD EXTRA DATA ================= */
  useEffect(() => {
    const load = async () => {
      const [o, p, m] = await Promise.all([
        getDocs(collection(db, "projectOtherPayments")),
        getDocs(collection(db, "projectProfits")),
        getDocs(collection(db, "members")),
      ]);

      setOtherPayments(o.docs.map(d => ({ id: d.id, ...d.data() })));
      setProfits(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(m.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  /* ================= FILTER ================= */
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
  const profitIncome = profits.filter(match);

  /* ================= QUIT MEMBERS ================= */
  const quitMemberIds = members
    .filter(m => m.status === "quit")
    .map(m => m.id);

  const quitRefunds = memberIncome.filter(
    p => quitMemberIds.includes(p.memberId)
  );

  /* ================= FORMAT ₹ ================= */
  const f = (n:number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  /* ================= UNIT WISE ================= */
  const unitWiseIncome = useMemo(() => {
    const map:any = {};
    memberIncome.forEach((p:any)=>{
      if(!p.unitId) return;
      if(!map[p.unitId]) {
        map[p.unitId] = { name: p.unitName, total: 0 };
      }
      map[p.unitId].total += Number(p.amount || 0);
    });
    return Object.values(map);
  }, [memberIncome]);

  /* ================= TOTALS ================= */
  const totalMemberIncome = memberIncome.reduce((s,p)=>s+Number(p.amount||0),0);
  const totalOtherIncome = otherIncome.reduce((s,p)=>s+Number(p.amount||0),0);
  const totalProfit = profitIncome.reduce((s,p)=>s+Number(p.amount||0),0);
  const totalExpense = expense.reduce((s,e)=>s+Number(e.amount||0),0);
  const totalQuitRefund = quitRefunds.reduce((s,p)=>s+Number(p.amount||0),0);

  const totalIncome =
    totalMemberIncome + totalOtherIncome + totalProfit;

  const balance =
    totalIncome - totalExpense - totalQuitRefund;

  /* ================= PRINT ================= */
  const exportPDF = () => window.print();

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h1 className="text-3xl font-bold">Monthly Balance Sheet</h1>
        <button onClick={exportPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          Export PDF
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border p-2">
          <option value="">All Projects</option>
          {projects.map(p=>(
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={unitId} onChange={e=>setUnitId(e.target.value)} className="border p-2">
          <option value="">All Units</option>
          {units.map(u=>(
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select value={month} onChange={e=>setMonth(e.target.value)} className="border p-2">
          <option value="">All Months</option>
          {MONTHS.map(m=><option key={m}>{m}</option>)}
        </select>

        <select value={year} onChange={e=>setYear(e.target.value)} className="border p-2">
          <option value="">All Years</option>
          {YEARS.map(y=><option key={y}>{y}</option>)}
        </select>
      </div>

      {/* VIEW SELECTOR */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-6 flex flex-wrap gap-2 print:hidden">
        {[
          ["overview","Overview"],
          ["unit","Unit Income"],
          ["member","Member Payments"],
          ["other","Other Income"],
          ["profit","Profit"],
          ["quit","Quit Refunds"],
          ["expense","Expenses"],
        ].map(([id,label])=>(
          <button
            key={id}
            onClick={()=>setView(id as any)}
            className={`px-4 py-2 rounded-lg ${
              view===id ? "bg-black text-white":"bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {view==="overview" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card title="Total Income" value={`₹${f(totalIncome)}`} green />
          <Card title="Total Expense" value={`₹${f(totalExpense)}`} red />
          <Card title="Quit Refund" value={`₹${f(totalQuitRefund)}`} red />
          <Card title="Net Balance" value={`₹${f(balance)}`} green={balance>=0} red={balance<0} />
        </div>
      )}

      {view==="unit" && <List title="Unit Wise Income" data={unitWiseIncome} f={f} />}
      {view==="member" && <List title="Member Payments" data={memberIncome.map(p=>({name:p.memberName,total:p.amount}))} f={f} />}
      {view==="other" && <List title="Other Income" data={otherIncome.map(o=>({name:o.title,total:o.amount}))} f={f} />}
      {view==="profit" && <List title="Profit" data={profitIncome.map(p=>({name:p.title,total:p.amount}))} f={f} />}
      {view==="quit" && <List title="Quit Member Refunds" data={quitRefunds.map(p=>({name:p.memberName,total:p.amount}))} f={f} red />}
      {view==="expense" && <List title="Expenses" data={expense.map(e=>({name:e.title,total:e.amount}))} f={f} red />}

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function Card({ title, value, green, red }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <h2 className={`text-3xl font-bold ${green?"text-green-700":red?"text-red-700":""}`}>
        {value}
      </h2>
    </div>
  );
}

function List({ title, data, f, red }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow mb-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <ul className="divide-y">
        {data.map((i:any,idx:number)=>(
          <li key={idx} className="py-2 flex justify-between">
            <span>{i.name}</span>
            <span className={`font-bold ${red?"text-red-700":"text-green-700"}`}>
              ₹{f(i.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
