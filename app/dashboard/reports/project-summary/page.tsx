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

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [reportType, setReportType] = useState("allUnits");

  // ======================
  // MONEY FORMAT (INDIA)
  // ======================
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  // ======================
  // LOAD DATA
  // ======================
  useEffect(() => {
    const load = async () => {
      const p = await getDocs(collection(db, "projects"));
      setProjects(p.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      const u = await getDocs(collection(db, "units"));
      setUnits(u.docs.map(d => ({ id: d.id, ...d.data() })));

      const pay = await getDocs(collection(db, "payments"));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));

      const exp = await getDocs(collection(db, "expenses"));
      setExpenses(exp.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    load();
  }, []);

  // ======================
  // FILTER (LIFETIME)
  // ======================
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

  // ======================
  // GROUP LOGIC
  // ======================
  const groupBy = (key: "unitId" | "memberId" | "projectId") => {
    const map: any = {};

    filteredPayments.forEach(p => {
      const id = p[key];
      if (!map[id]) {
        map[id] = {
          total: 0,
          name:
            key === "unitId"
              ? p.unitName
              : key === "memberId"
              ? p.memberName
              : p.projectName,
        };
      }
      map[id].total += Number(p.amount || 0);
    });

    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  };

  const allUnitsReport = groupBy("unitId");
  const perUnitMembers = groupBy("memberId");
  const perProject = groupBy("projectId");

  // ======================
  // TOTALS
  // ======================
  const totalIncome = filteredPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  const totalExpense = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-5">
        Project Summary (Lifetime)
      </h1>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">

        <select
          value={reportType}
          onChange={e => setReportType(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="allUnits">All Units</option>
          <option value="perUnit">Per Unit — Members</option>
          <option value="perMember">All Members</option>
          <option value="perProject">All Projects</option>
        </select>

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          disabled={reportType !== "perUnit" && reportType !== "perMember"}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">All Units</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm">Total Income</p>
          <h2 className="text-2xl font-bold text-green-700">
            ₹{formatINR(totalIncome)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm">Total Expense</p>
          <h2 className="text-2xl font-bold text-red-700">
            ₹{formatINR(totalExpense)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm">Net Balance</p>
          <h2 className={`text-2xl font-bold ${balance >= 0 ? "text-green-700":"text-red-700"}`}>
            ₹{formatINR(balance)}
          </h2>
        </div>

      </div>

      {/* PAYMENT REPORTS */}
      {reportType === "allUnits" && (
        <Section title="Unit wise Income" data={allUnitsReport} formatINR={formatINR} />
      )}

      {reportType === "perUnit" && (
        <Section title="Members in Selected Unit" data={perUnitMembers} formatINR={formatINR} />
      )}

      {reportType === "perMember" && (
        <Section title="Member wise Income" data={perUnitMembers} formatINR={formatINR} />
      )}

      {reportType === "perProject" && (
        <Section title="Project wise Income" data={perProject} formatINR={formatINR} />
      )}

      {/* EXPENSE SECTION */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mt-6">
        <h2 className="text-lg font-semibold mb-3">
          Expense Records (Lifetime)
        </h2>

        {filteredExpenses.length === 0 && (
          <p className="text-gray-600">No expenses recorded.</p>
        )}

        <ul className="space-y-2">
          {filteredExpenses.map(e => (
            <li key={e.id} className="p-3 border rounded bg-gray-50 flex justify-between">
              <span className="font-medium">{e.title}</span>
              <span className="font-bold text-red-700">
                ₹{formatINR(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

function Section({ title, data, formatINR }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>

      {data.length === 0 && (
        <p className="text-gray-600">No records found.</p>
      )}

      <ul className="space-y-2">
        {data.map((i: any, index: number) => (
          <li
            key={index}
            className="p-3 border rounded bg-gray-50 flex justify-between"
          >
            <span className="font-medium text-black">{i.name}</span>
            <span className="font-bold text-green-700">
              ₹{formatINR(i.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
