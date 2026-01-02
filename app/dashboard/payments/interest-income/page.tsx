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
  const [type, setType] = useState<"income" | "expense">("income");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");

  // ================= FORMAT ₹ =================
  const f = (n:number) =>
    new Intl.NumberFormat("en-IN").format(Number(n || 0));

  // ================= LOAD =================
  const load = async () => {
    const snap = await getDocs(collection(db, "interestLedger"));
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
  const addRecord = async () => {
    if (!title.trim() || !amount.trim() || !month || !year) return;

    await addDoc(collection(db, "interestLedger"), {
      title,
      type,
      amount: Number(amount),
      month,
      year,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setAmount("");
    setMonth("");
    setYear("");
    setType("income");

    load();
  };

  // ================= SEARCH =================
  const filtered = records.filter((i:any)=>{
    if(!search.trim()) return true;
    const k = search.toLowerCase();

    return [
      i.title,
      i.type,
      i.month,
      i.year ? String(i.year): "",
      i.amount ? String(i.amount): ""
    ]
    .join(" ")
    .toLowerCase()
    .includes(k);
  });

  // ================= TOTALS =================
  const totalIncome = filtered
    .filter(i => i.type === "income")
    .reduce((s,i)=>s+Number(i.amount||0),0);

  const totalExpense = filtered
    .filter(i => i.type === "expense")
    .reduce((s,i)=>s+Number(i.amount||0),0);

  const balance = totalIncome - totalExpense;

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
        Interest Ledger (Independent)
      </h1>

      {/* ADD FORM */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Add Record
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Title (Bank Interest / Charges)"
            className="border rounded px-3 py-2"
          />

          <input
            value={amount}
            onChange={e=>setAmount(e.target.value)}
            placeholder="Amount"
            className="border rounded px-3 py-2"
          />

          <select
            value={type}
            onChange={e=>setType(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={month}
            onChange={e=>setMonth(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Month</option>
            {MONTHS.map(m=>(
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            value={year}
            onChange={e=>setYear(e.target.value)}
            placeholder="Year"
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={addRecord}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Save
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <input
          placeholder="Search ledger"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Total Income" value={`₹${f(totalIncome)}`} green />
        <Card title="Total Expense" value={`₹${f(totalExpense)}`} red />
        <Card
          title="Balance"
          value={`₹${f(balance)}`}
          green={balance>=0}
          red={balance<0}
        />
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">
          Ledger Records
        </h2>

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
                  {i.month} {i.year} • {i.type}
                </p>
              </div>

              <span
                className={`font-bold ${
                  i.type==="income" ? "text-green-700" : "text-red-700"
                }`}
              >
                ₹{f(i.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

/* ================= SMALL CARD ================= */

function Card({ title, value, green, red }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <h2
        className={`text-3xl font-bold ${
          green ? "text-green-700" : red ? "text-red-700" : ""
        }`}
      >
        {value}
      </h2>
    </div>
  );
}
