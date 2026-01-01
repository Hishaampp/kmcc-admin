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

export default function InterestIncomePage() {
  const router = useRouter();

  const [records, setRecords] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  // ================= LOAD =================
  const load = async () => {
    const snap = await getDocs(collection(db, "interestIncomes"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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
  const addIncome = async () => {
    if (!title.trim() || !amount.trim() || !month || !year) return;

    await addDoc(collection(db, "interestIncomes"), {
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

    load();
  };

  // ================= SEARCH =================
  const filtered = records.filter((i:any)=>{
    if(!search.trim()) return true;

    const k = search.toLowerCase();

    return [
      i.title,
      i.month,
      i.year ? String(i.year): "",
      i.amount ? String(i.amount): ""
    ]
    .join(" ")
    .toLowerCase()
    .includes(k);
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
        Interest Income
      </h1>

      {/* ADD FORM */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Add Interest
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Title (Example: Bank Interest)"
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
          onClick={addIncome}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Save Interest
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <input
          placeholder="Search Interest Records"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full text-black placeholder-gray-700"
        />
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <p className="text-sm">Total Interest Income</p>
        <h2 className="text-2xl font-bold text-green-700">
          ₹{total}
        </h2>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">Records</h2>

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
                <p className="font-semibold text-gray-900">
                  {i.title}
                </p>
                <p className="text-sm text-gray-700">
                  {i.month} {i.year}
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
