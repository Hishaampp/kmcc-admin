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
import { logAuditEvent } from "@/lib/auditLog";

export default function InvestmentPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const f = (n:number)=>new Intl.NumberFormat("en-IN").format(n||0);

  /* LOAD */
  const load = async () => {
    const p = await getDocs(collection(db,"projects"));
    setProjects(p.docs.map(d=>({id:d.id,...d.data()})));

    const r = await getDocs(collection(db,"projectInvestments"));
    setRecords(r.docs.map(d=>({id:d.id,...d.data()})));
  };

  useEffect(()=>{ load(); },[]);

  const resetForm = () => {
    setProjectId("");
    setTitle("");
    setAmount("");
    setEditingId(null);
  };

  /* ADD / UPDATE */
  const saveInvestment = async () => {
    if(!projectId || !title || !amount) return;

    const project = projects.find(p=>p.id===projectId);

    const payload = {
      projectId,
      projectName: project?.name || "",
      title,
      amount: Number(amount),
    };

    if(editingId){
      // Find old record for audit comparison
      const oldInvestment = records.find(r => r.id === editingId);

      await updateDoc(doc(db,"projectInvestments",editingId), payload);
      
      // Log audit for edit
      await logAuditEvent({
        action: "investment_edited",
        collectionName: "projectInvestments",
        documentId: editingId,
        details: {
          projectName: project?.name || "",
          investmentTitle: title,
          amount: Number(amount),
          oldAmount: oldInvestment?.amount,
          oldTitle: oldInvestment?.title
        }
      });
    } else {
      const newRef = await addDoc(collection(db,"projectInvestments"),{
        ...payload,
        createdAt: serverTimestamp()
      });
      
      // Log audit for add
      await logAuditEvent({
        action: "investment_added",
        collectionName: "projectInvestments",
        documentId: newRef.id,
        details: {
          projectName: project?.name || "",
          investmentTitle: title,
          amount: Number(amount)
        }
      });
    }

    resetForm();
    load();
  };

  /* EDIT */
  const editInvestment = (r:any) => {
    setEditingId(r.id);
    setProjectId(r.projectId);
    setTitle(r.title);
    setAmount(String(r.amount));
    window.scrollTo({top:0,behavior:"smooth"});
  };

  /* DELETE */
  const deleteInvestment = async (id:string) => {
    const investment = records.find(r => r.id === id);
    if(!confirm("Delete this investment?")) return;
    
    await deleteDoc(doc(db,"projectInvestments",id));
    
    // Log audit for delete
    await logAuditEvent({
      action: "investment_deleted",
      collectionName: "projectInvestments",
      documentId: id,
      details: {
        projectName: investment?.projectName || "Unknown",
        investmentTitle: investment?.title || "Unknown",
        amount: investment?.amount || 0
      }
    });
    
    load();
  };

  const total = records.reduce((s,r)=>s+Number(r.amount||0),0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black">

      <h1 className="text-2xl font-bold mb-4">Project Investments</h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl border mb-6">
        <h2 className="font-semibold mb-3">
          {editingId ? "Edit Investment" : "Add Investment"}
        </h2>

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

        <div className="mt-3 flex gap-3">
          <button 
            onClick={saveInvestment} 
            className={`px-4 py-2 text-white rounded ${
              editingId ? "bg-blue-600" : "bg-green-600"
            }`}
          >
            {editingId ? "Update Investment" : "Save Investment"}
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
        <p className="text-sm">Total Investment</p>
        <h2 className="text-2xl font-bold text-blue-700">₹{f(total)}</h2>
      </div>

      {/* LIST */}
      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Investment Records</h2>

        {records.length === 0 && (
          <p className="text-gray-600">No investments found.</p>
        )}

        <ul className="divide-y">
          {records.map(r=>(
            <li key={r.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-gray-600">{r.projectName}</p>
              </div>

              <div className="flex gap-3 items-center">
                <span className="font-bold text-blue-700">₹{f(r.amount)}</span>
                <button 
                  onClick={()=>editInvestment(r)} 
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Edit
                </button>
                <button 
                  onClick={()=>deleteInvestment(r.id)} 
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}