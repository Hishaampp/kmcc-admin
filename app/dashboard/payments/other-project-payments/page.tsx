"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function OtherProjectPayments() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  // ================= LOAD DATA =================
  const load = async () => {
    const p = await getDocs(collection(db, "projects"));
    setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));

    const r = await getDocs(collection(db, "projectOtherPayments"));
    const list = r.docs.map(d => ({ id: d.id, ...d.data() }));

    // sort latest → oldest
    list.sort((a:any,b:any)=>{
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

    setRecords(list);
  };

  useEffect(() => {
    load();
  }, []);

  // ================= ADD =================
  const addPayment = async () => {
    if (!projectId || !title.trim() || !amount.trim() || !month || !year) return;

    const project = projects.find(p => p.id === projectId);

    await addDoc(collection(db, "projectOtherPayments"), {
      projectId,
      projectName: project?.name || "",
      title,
      amount: Number(amount),
      month,
      year,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setAmount("");
    setMonth("");
    setYear("");
    setProjectId("");

    load();
  };

  // ================= FILTER & SEARCH =================
  const filtered = records.filter((i:any)=>{
    let ok = true;

    if(projectId && i.projectId !== projectId) ok = false;
    if(month && i.month !== month) ok = false;
    if(year && String(i.year) !== String(year)) ok = false;

    if(search.trim()) {
      const k = search.toLowerCase();
      const text = [
        i.title,
        i.projectName,
        i.month,
        i.year ? String(i.year): "",
        i.amount ? String(i.amount): ""
      ].join(" ").toLowerCase();

      if(!text.includes(k)) ok = false;
    }

    return ok;
  });

  const total = filtered.reduce((t,i)=>t+Number(i.amount||0),0);

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Other Project Payments
      </h1>

      {/* ADD FORM */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Add Other Project Payment
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

          <select
            value={projectId}
            onChange={e=>setProjectId(e.target.value)}
            className="border rounded px-3 py-2 text-black"
          >
            <option value="">Select Project</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Payment Title"
            className="border rounded px-3 py-2 text-black"
          />

          <input
            value={amount}
            onChange={e=>setAmount(e.target.value)}
            placeholder="Amount"
            className="border rounded px-3 py-2 text-black"
          />

          <select
            value={month}
            onChange={e=>setMonth(e.target.value)}
            className="border rounded px-3 py-2 text-black"
          >
            <option value="">Select Month</option>
            {MONTHS.map(m=>(
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            value={year}
            onChange={e=>setYear(e.target.value)}
            placeholder="Year"
            className="border rounded px-3 py-2 text-black"
          />
        </div>

        <button
          onClick={addPayment}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Save Payment
        </button>
      </div>

      {/* FILTER + SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">

        <select
          value={projectId}
          onChange={e=>setProjectId(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">All Projects</option>
          {projects.map(p=>(
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={e=>setMonth(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        >
          <option value="">All Months</option>
          {MONTHS.map(m=>(
            <option key={m}>{m}</option>
          ))}
        </select>

        <input
          value={year}
          onChange={e=>setYear(e.target.value)}
          placeholder="Year"
          className="border rounded px-3 py-2 text-black"
        />

        <input
          placeholder="Search payment"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        />
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <p className="text-sm">Total Amount</p>
        <h2 className="text-2xl font-bold text-green-700">
          ₹{total}
        </h2>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">Payments</h2>

        {filtered.length === 0 && (
          <p className="text-gray-600">No records found.</p>
        )}

        <ul className="space-y-2">
          {filtered.map((i:any)=>(
            <li
              key={i.id}
              className="p-3 border rounded bg-gray-50 flex justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{i.title}</p>
                <p className="text-sm text-gray-700">{i.projectName}</p>
                <p className="text-xs text-gray-600">
                  {i.month || ""} {i.year || ""}
                </p>
              </div>

              <span className="font-bold text-green-700">
                ₹{i.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
