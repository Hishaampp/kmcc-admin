"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function InvestmentPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const f = (n:number)=>new Intl.NumberFormat("en-IN").format(n||0);

  /* LOAD */
  const load = async () => {
    const p = await getDocs(collection(db,"projects"));
    setProjects(p.docs.map(d=>({id:d.id,...d.data()})));

    const r = await getDocs(collection(db,"projectInvestments"));
    setRecords(r.docs.map(d=>({id:d.id,...d.data()})));
  };

  useEffect(()=>{ load(); },[]);

  /* ADD */
  const addInvestment = async () => {
    if(!projectId || !title || !amount) return;

    const project = projects.find(p=>p.id===projectId);

    await addDoc(collection(db,"projectInvestments"),{
      projectId,
      projectName: project?.name || "",
      title,
      amount: Number(amount),
      createdAt: serverTimestamp()
    });

    setTitle(""); setAmount(""); setProjectId("");
    load();
  };

  const total = records.reduce((s,r)=>s+Number(r.amount||0),0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black">

      <h1 className="text-2xl font-bold mb-4">Project Investments</h1>

      {/* ADD */}
      <div className="bg-white p-4 rounded-xl border mb-6">
        <h2 className="font-semibold mb-3">Add Investment</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border p-2">
            <option value="">Select Project</option>
            {projects.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} className="border p-2"/>
          <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className="border p-2"/>
        </div>

        <button onClick={addInvestment} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
          Save Investment
        </button>
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 rounded-xl border mb-4">
        <p className="text-sm">Total Investment</p>
        <h2 className="text-2xl font-bold text-blue-700">₹{f(total)}</h2>
      </div>

      {/* LIST */}
      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Investment Records</h2>

        <ul className="divide-y">
          {records.map(r=>(
            <li key={r.id} className="py-2 flex justify-between">
              <span>{r.projectName} — {r.title}</span>
              <span className="font-bold">₹{f(r.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
