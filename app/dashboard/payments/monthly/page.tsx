"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function MonthlyReportsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [reportType, setReportType] = useState("allUnits");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 4 }, (_, i) => 2023 + i);

  // ======================
  // LOAD DATA
  // ======================
  useEffect(() => {
    const load = async () => {
      const p = await getDocs(collection(db, "projects"));
      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));

      const u = await getDocs(collection(db, "units"));
      setUnits(u.docs.map(d => ({ id: d.id, ...d.data() })));

      const m = await getDocs(collection(db, "members"));
      setMembers(m.docs.map(d => ({ id: d.id, ...d.data() })));

      const pay = await getDocs(collection(db, "payments"));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    load();
  }, []);

  // ======================
  // UTIL HELPERS
  // ======================
  const getMonthIndex = (value: string) => {
    if (!value) return null;
    const clean = value.trim().toLowerCase();

    const months = [
      "january","february","march","april","may","june",
      "july","august","september","october","november","december"
    ];

    for (let i = 0; i < months.length; i++) {
      if (clean.includes(months[i])) return i;
    }
    return null;
  };

  const extractYear = (p: any) => {
    if (p.year) return Number(p.year);
    return null;
  };

  const selectedMonthIndex = getMonthIndex(month);

  // ======================
  // FILTER
  // ======================
  const filteredPayments = payments.filter(p => {
    if (!month || !year) return false;

    const matchesMonth =
      getMonthIndex(p.month) === selectedMonthIndex;

    const derivedYear = extractYear(p);
    if (!derivedYear) return false; // strict honest data

    const matchesYear = String(derivedYear) === String(year);

    const matchesProject = projectId ? p.projectId === projectId : true;
    const matchesUnit = unitId ? p.unitId === unitId : true;

    return matchesMonth && matchesYear && matchesProject && matchesUnit;
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
            key === "unitId" ? p.unitName :
            key === "memberId" ? p.memberName :
            p.projectName,
        };
      }
      map[id].total += Number(p.amount || 0);
    });

    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  };

  const allUnitsReport = groupBy("unitId");
  const perUnitMembers = groupBy("memberId");
  const perProject = groupBy("projectId");

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

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
        Monthly Reports
      </h1>

      {/* ================= FILTERS ================= */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">

        <select value={reportType} onChange={e => setReportType(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="allUnits">Monthly — All Units</option>
          <option value="perUnit">Monthly — Per Unit</option>
          <option value="perMember">Monthly — Per Members</option>
          <option value="perProject">Monthly — Per Projects</option>
        </select>

        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select value={unitId} onChange={e => setUnitId(e.target.value)}
          disabled={reportType !== "perUnit" && reportType !== "perMember"}
          className="border rounded px-3 py-2">
          <option value="">All Units</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Select Month</option>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>

        <select value={year} onChange={e => setYear(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">Select Year</option>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>

      </div>

      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm">Total Collected</p>
          <h2 className="text-2xl font-bold text-green-700">₹{totalAmount}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm">Payments Count</p>
          <h2 className="text-2xl font-bold">{filteredPayments.length}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow">
          <p className="text-sm">Report Type</p>
          <h2 className="text-xl font-semibold capitalize">{reportType}</h2>
        </div>
      </div>

      {/* ================= REPORT RENDER ================= */}

      {/* ALL UNITS */}
      {reportType === "allUnits" && (
        <Section title="Unit wise Collection" data={allUnitsReport} />
      )}

      {/* PER UNIT MEMBERS */}
      {reportType === "perUnit" && (
        <Section title="Members in Selected Unit" data={perUnitMembers} />
      )}

      {/* PER MEMBER */}
      {reportType === "perMember" && (
        <Section title="Member wise Collection" data={perUnitMembers} />
      )}

      {/* PER PROJECT */}
      {reportType === "perProject" && (
        <Section title="Project wise Collection" data={perProject} />
      )}

    </div>
  );
}

function Section({ title, data }: any) {
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
            <span className="font-medium">{i.name}</span>
            <span className="font-bold text-green-700">₹{i.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
