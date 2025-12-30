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
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [reportType, setReportType] = useState("allUnits");

  // ======================
  // LOAD DATA
  // ======================
  useEffect(() => {
    const load = async () => {
      const p = await getDocs(collection(db, "projects"));
      setProjects(
        p.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      );

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
  // FILTER (LIFETIME)
  // ======================
  const filteredPayments = payments.filter(p => {
    const matchesProject = projectId ? p.projectId === projectId : true;
    const matchesUnit = unitId ? p.unitId === unitId : true;
    return matchesProject && matchesUnit;
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
        Project Summary
      </h1>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">

        <select
          value={reportType}
          onChange={e => setReportType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="allUnits">All Units — Summary</option>
          <option value="perUnit">Per Unit — Members</option>
          <option value="perMember">All Members</option>
          <option value="perProject">All Projects</option>
        </select>

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border rounded px-3 py-2"
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
          className="border rounded px-3 py-2"
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
          <p className="text-sm">Total Collected (Lifetime)</p>
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

      {/* REPORTS */}
      {reportType === "allUnits" && (
        <Section title="Unit wise Collection (Lifetime)" data={allUnitsReport} />
      )}

      {reportType === "perUnit" && (
        <Section title="Members in Selected Unit (Lifetime)" data={perUnitMembers} />
      )}

      {reportType === "perMember" && (
        <Section title="Member wise Collection (Lifetime)" data={perUnitMembers} />
      )}

      {reportType === "perProject" && (
        <Section title="Project wise Collection (Lifetime)" data={perProject} />
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
