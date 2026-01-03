"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

/* ================= FORMATTERS ================= */
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n || 0);

const money2 = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

/* ================= COMPONENT ================= */
export default function ShareDetailsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [otherIncome, setOtherIncome] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      const [
        p, pay, exp, other, asset, mem
      ] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "expenses")),
        getDocs(collection(db, "projectOtherPayments")),
        getDocs(collection(db, "projectAssets")),
        getDocs(collection(db, "members")),
      ]);

      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
      setExpenses(exp.docs.map(d => ({ id: d.id, ...d.data() })));
      setOtherIncome(other.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssets(asset.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(mem.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  /* ================= CALCULATIONS ================= */
  const rows = useMemo(() => {
    return projects.map(project => {

      const projectPayments = payments.filter(
        p => p.projectId === project.id
      );

      const totalSharePayment = projectPayments.reduce(
        (s,p)=>s+Number(p.amount||0),0
      );

      const quitMemberIds = members
        .filter(m => m.status === "quit" && m.quitProjectId === project.id)
        .map(m => m.id);

      const quitPayments = projectPayments
        .filter(p => quitMemberIds.includes(p.memberId))
        .reduce((s,p)=>s+Number(p.amount||0),0);

      const other = otherIncome
        .filter(o => o.projectId === project.id)
        .reduce((s,o)=>s+Number(o.amount||0),0);

      const expense = expenses
        .filter(e => e.projectId === project.id)
        .reduce((s,e)=>s+Number(e.amount||0),0);

      const assetValue = assets
        .filter(a => a.projectId === project.id)
        .reduce((s,a)=>s+Number(a.value||0),0);

      const totalIncome = totalSharePayment + other;
      const cashBalance = totalIncome - expense;
      const totalProjectValue = cashBalance + assetValue;

      const totalShare =
        (totalSharePayment - quitPayments) / 1000;

      const currentShareValue =
        totalShare > 0
          ? totalProjectValue / totalShare
          : 0;

      return {
        projectName: project.name,
        totalSharePayment,
        other,
        totalIncome,
        expense,
        cashBalance,
        assetValue,
        totalProjectValue,
        totalShare,
        currentShareValue,
      };
    });
  }, [projects, payments, expenses, otherIncome, assets, members]);

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      <h1 className="text-3xl font-bold mb-6">
        Share Details
      </h1>

      <div className="bg-white rounded-xl border shadow overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200">
            <tr>
              {[
                "Project",
                "Share Holder Payment",
                "Other Income",
                "Total Income",
                "Expense",
                "Cash Balance",
                "Asset Value",
                "Total Project Value",
                "Total Share",
                "One Share",
                "Current Share Value"
              ].map(h=>(
                <th key={h} className="border px-3 py-2 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="even:bg-gray-50">
                <td className="border px-3 py-2 font-medium">
                  {r.projectName}
                </td>
                <td className="border px-3 py-2">₹{money(r.totalSharePayment)}</td>
                <td className="border px-3 py-2">₹{money(r.other)}</td>
                <td className="border px-3 py-2">₹{money(r.totalIncome)}</td>
                <td className="border px-3 py-2">₹{money(r.expense)}</td>
                <td className="border px-3 py-2">₹{money(r.cashBalance)}</td>
                <td className="border px-3 py-2">₹{money(r.assetValue)}</td>
                <td className="border px-3 py-2 font-semibold">
                  ₹{money(r.totalProjectValue)}
                </td>
                <td className="border px-3 py-2">
                  {money2(r.totalShare)}
                </td>
                <td className="border px-3 py-2">₹1,000</td>
                <td className="border px-3 py-2 font-bold text-green-700">
                  ₹{money2(r.currentShareValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
