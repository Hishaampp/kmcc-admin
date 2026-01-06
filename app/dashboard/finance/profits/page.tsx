"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function ProfitPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const f = (n:number)=>new Intl.NumberFormat("en-IN").format(n||0);

  const load = async () => {
    const p = await getDocs(collection(db,"projects"));
    setProjects(p.docs.map(d=>({id:d.id,...d.data()})));

    const r = await getDocs(collection(db,"projectProfits"));
    setRecords(r.docs.map(d=>({id:d.id,...d.data()})));
  };

  useEffect(()=>{ load(); },[]);

  const addProfit = async () => {
    if(!projectId || !title || !amount) return;

    const project = projects.find(p=>p.id===projectId);

    await addDoc(collection(db,"projectProfits"),{
      projectId,
      projectName: project?.name || "",
      title,
      amount: Number(amount),
      month,
      year,
      createdAt: serverTimestamp()
    });

    setTitle(""); setAmount(""); setMonth(""); setYear("");
    load();
  };

  const total = records.reduce((s,r)=>s+Number(r.amount||0),0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black">

      <h1 className="text-2xl font-bold mb-4">Project Profits</h1>

      <div className="bg-white p-4 rounded-xl border mb-6">
        <h2 className="font-semibold mb-3">Add Profit</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border p-2">
            <option value="">Select Project</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="border p-2"/>
          <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className="border p-2"/>

          <select value={month} onChange={e=>setMonth(e.target.value)} className="border p-2">
            <option value="">Month</option>
            {MONTHS.map(m=><option key={m}>{m}</option>)}
          </select>

          <input placeholder="Year" value={year} onChange={e=>setYear(e.target.value)} className="border p-2"/>
        </div>

        <button onClick={addProfit} className="mt-3 px-4 py-2 bg-green-600 text-white rounded">
          Save Profit
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-4">
        <p className="text-sm">Total Profit</p>
        <h2 className="text-2xl font-bold text-green-700">₹{f(total)}</h2>
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Profit Records</h2>

        <ul className="divide-y">
          {records.map(r=>(
            <li key={r.id} className="py-2 flex justify-between">
              <span>{r.projectName} — {r.title}</span>
              <span className="font-bold text-green-700">₹{f(r.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
