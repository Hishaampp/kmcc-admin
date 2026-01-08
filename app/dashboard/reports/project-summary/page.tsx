"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Project = {
  id: string;
  name?: string;
};

export default function ProjectSummaryPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [otherIncome, setOtherIncome] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [reportType, setReportType] = useState("allUnits");

  /* ================= MONEY FORMAT ================= */
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      const [
        p, u, pay, exp, other, prof, mem
      ] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "units")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "expenses")),
        getDocs(collection(db, "projectOtherPayments")),
        getDocs(collection(db, "projectProfits")),
        getDocs(collection(db, "members")),
      ]);

      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setUnits(u.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
      setExpenses(exp.docs.map(d => ({ id: d.id, ...d.data() })));
      setOtherIncome(other.docs.map(d => ({ id: d.id, ...d.data() })));
      setProfits(prof.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(mem.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  /* ================= FILTER ================= */
  const filteredPayments = payments.filter(p => {
    if (projectId && p.projectId !== projectId) return false;
    if (unitId && p.unitId !== unitId) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (projectId && e.projectId !== projectId) return false;
    if (unitId && e.unitId !== unitId) return false;
    return true;
  });

  const filteredOtherIncome = otherIncome.filter(o => {
    if (projectId && o.projectId !== projectId) return false;
    return true;
  });

  const filteredProfit = profits.filter(p => {
    if (projectId && p.projectId !== projectId) return false;
    return true;
  });

  /* ================= QUIT MEMBERS ================= */
  const quitMemberIds = members
    .filter(m => m.status === "quit")
    .map(m => m.id);

  const quitRefunds = filteredPayments.filter(p =>
    quitMemberIds.includes(p.memberId)
  );

  /* ================= GROUP ================= */
  const groupBy = (key: "unitId" | "memberId" | "projectId") => {
    const map: any = {};
    filteredPayments.forEach(p => {
      const id = p[key];
      if (!map[id]) {
        map[id] = {
          name:
            key === "unitId"
              ? p.unitName
              : key === "memberId"
              ? p.memberName
              : p.projectName,
          total: 0,
        };
      }
      map[id].total += Number(p.amount || 0);
    });
    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  };

  const allUnitsReport = groupBy("unitId");
  const perUnitMembers = groupBy("memberId");
  const perProject = groupBy("projectId");

  /* ================= TOTALS ================= */
  const totalMemberIncome = filteredPayments.reduce((s,p)=>s+Number(p.amount||0),0);
  const totalOtherIncome = filteredOtherIncome.reduce((s,o)=>s+Number(o.amount||0),0);
  const totalProfit = filteredProfit.reduce((s,p)=>s+Number(p.amount||0),0);
  const totalExpense = filteredExpenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const totalQuitRefund = quitRefunds.reduce((s,p)=>s+Number(p.amount||0),0);

  const totalIncome = totalMemberIncome + totalOtherIncome + totalProfit;
  const balance = totalIncome - totalExpense - totalQuitRefund;

  /* ================= PDF ================= */
  const exportPDF = () => window.print();

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* ACTION BAR */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <button onClick={() => router.back()} className="px-4 py-2 bg-black text-white rounded">
          ← Back
        </button>
        <button onClick={exportPDF} className="px-4 py-2 bg-green-600 text-white rounded">
          Export PDF
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-5">
        Project Summary (Lifetime)
      </h1>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
        <select value={reportType} onChange={e=>setReportType(e.target.value)} className="border p-2">
          <option value="allUnits">All Units</option>
          <option value="perUnit">Per Unit</option>
          <option value="perMember">All Members</option>
          <option value="perProject">All Projects</option>
        </select>

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
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Summary title="Member Income" value={totalMemberIncome} />
        <Summary title="Other Income" value={totalOtherIncome} />
        <Summary title="Profit" value={totalProfit} green />
        <Summary title="Quit Refund" value={totalQuitRefund} red />
        <Summary title="Net Balance" value={balance} green={balance>=0} red={balance<0} />
      </div>

      {/* REPORTS */}
      {reportType==="allUnits" && <Section title="Unit wise Member Income" data={allUnitsReport} formatINR={formatINR} />}
      {reportType==="perUnit" && <Section title="Members in Unit" data={perUnitMembers} formatINR={formatINR} />}
      {reportType==="perMember" && <Section title="Member wise Income" data={perUnitMembers} formatINR={formatINR} />}
      {reportType==="perProject" && <Section title="Project wise Income" data={perProject} formatINR={formatINR} />}

      <Section title="Other Project Income" data={filteredOtherIncome.map(o=>({name:o.title,total:o.amount}))} formatINR={formatINR} />
      <Section title="Profit Records" data={filteredProfit.map(p=>({name:p.title,total:p.amount}))} formatINR={formatINR} />
      <Section title="Quit Member Refunds" data={quitRefunds.map(p=>({name:p.memberName,total:p.amount}))} formatINR={formatINR} />
      <Section title="Expense Records" data={filteredExpenses.map(e=>({name:e.title,total:e.amount}))} formatINR={formatINR} />

      {/* PRINT */}
      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function Summary({ title, value, green, red }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow">
      <p className="text-sm">{title}</p>
      <h2 className={`text-2xl font-bold ${green?"text-green-700":red?"text-red-700":""}`}>
        ₹{new Intl.NumberFormat("en-IN").format(value)}
      </h2>
    </div>
  );
}

function Section({ title, data, formatINR }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mt-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="text-gray-600">No records found.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((i:any,idx:number)=>(
            <li key={idx} className="p-3 border rounded bg-gray-50 flex justify-between">
              <span>{i.name}</span>
              <span className="font-bold">₹{formatINR(i.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
