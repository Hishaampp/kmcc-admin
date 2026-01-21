"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { logAuditEvent } from "@/lib/auditLog"; // ✅ ADDED

export default function ProfitPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const resetForm = () => {
    setProjectId(""); setTitle(""); setAmount(""); setMonth(""); setYear("");
    setEditingId(null);
  };

  const saveProfit = async () => {
    if(!projectId || !title || !amount) return;

    const project = projects.find(p=>p.id===projectId);

    const payload = {
      projectId,
      projectName: project?.name || "",
      title,
      amount: Number(amount),
      month,
      year,
    };

    if(editingId){
      await updateDoc(doc(db,"projectProfits",editingId), payload);
      
      // 🔔 LOG AUDIT EVENT
      await logAuditEvent({
        action: "profit_added",
        collectionName: "projectProfits",
        documentId: editingId,
        details: {
          action: "Updated",
          projectName: project?.name,
          profitTitle: title,
          amount: `₹${f(Number(amount))}`,
          period: month && year ? `${month} ${year}` : "Not specified",
        },
      });
    } else {
      const newRef = await addDoc(collection(db,"projectProfits"),{
        ...payload,
        createdAt: serverTimestamp()
      });
      
      // 🔔 LOG AUDIT EVENT
      await logAuditEvent({
        action: "profit_added",
        collectionName: "projectProfits",
        documentId: newRef.id,
        details: {
          projectName: project?.name,
          profitTitle: title,
          amount: `₹${f(Number(amount))}`,
          period: month && year ? `${month} ${year}` : "Not specified",
        },
      });
    }

    resetForm();
    load();
  };

  const editProfit = (r:any) => {
    setEditingId(r.id);
    setProjectId(r.projectId);
    setTitle(r.title);
    setAmount(String(r.amount));
    setMonth(r.month);
    setYear(r.year);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const deleteProfit = async (id:string) => {
    if(!confirm("Delete this profit entry?")) return;
    
    const profit = records.find(r => r.id === id);
    
    await deleteDoc(doc(db,"projectProfits",id));
    
    // 🔔 LOG AUDIT EVENT
    await logAuditEvent({
      action: "profit_deleted",
      collectionName: "projectProfits",
      documentId: id,
      details: {
        projectName: profit?.projectName,
        profitTitle: profit?.title,
        amount: `₹${f(profit?.amount)}`,
        period: profit?.month && profit?.year ? `${profit.month} ${profit.year}` : "Not specified",
      },
    });
    
    load();
  };

  const total = records.reduce((s,r)=>s+Number(r.amount||0),0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black">

      <h1 className="text-2xl font-bold mb-4">Project Profits</h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl border mb-6">
        <h2 className="font-semibold mb-3">
          {editingId ? "Edit Profit" : "Add Profit"}
        </h2>

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

        <div className="mt-3 flex gap-3">
          <button onClick={saveProfit} className="px-4 py-2 bg-green-600 text-white rounded">
            {editingId ? "Update Profit" : "Save Profit"}
          </button>

          {editingId && (
            <button onClick={resetForm} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 rounded-xl border mb-4">
        <p className="text-sm">Total Profit</p>
        <h2 className="text-2xl font-bold text-green-700">₹{f(total)}</h2>
      </div>

      {/* LIST */}
      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Profit Records</h2>

        <ul className="divide-y">
          {records.map(r=>(
            <li key={r.id} className="py-2 flex justify-between items-center">
              <span>{r.projectName} — {r.title}</span>

              <div className="flex gap-3 items-center">
                <span className="font-bold text-green-700">₹{f(r.amount)}</span>
                <button onClick={()=>editProfit(r)} className="text-blue-600 text-sm">Edit</button>
                <button onClick={()=>deleteProfit(r.id)} className="text-red-600 text-sm">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}