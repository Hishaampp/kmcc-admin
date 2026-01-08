"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

/* ================= FORMATTERS ================= */
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const money2 = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

type Row = {
  projectName: string;
  totalSharePayment: number;
  other: number;
  profit: number;
  totalIncome: number;
  expense: number;
  quitRefund: number;
  cashBalance: number;
  assetValue: number;
  investment: number;
  totalProjectValue: number;
  totalShare: number;
  shareValue: number;
};

export default function ShareDetailsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [otherIncome, setOtherIncome] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [interestLedger, setInterestLedger] = useState<any[]>([]);

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      const [
        p, pay, exp, other, asset, invest, profit, mem, interest
      ] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "expenses")),
        getDocs(collection(db, "projectOtherPayments")),
        getDocs(collection(db, "projectAssets")),
        getDocs(collection(db, "projectInvestments")),
        getDocs(collection(db, "projectProfits")),
        getDocs(collection(db, "members")),
        getDocs(collection(db, "interestLedger")),
      ]);

      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
      setExpenses(exp.docs.map(d => ({ id: d.id, ...d.data() })));
      setOtherIncome(other.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssets(asset.docs.map(d => ({ id: d.id, ...d.data() })));
      setInvestments(invest.docs.map(d => ({ id: d.id, ...d.data() })));
      setProfits(profit.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(mem.docs.map(d => ({ id: d.id, ...d.data() })));
      setInterestLedger(interest.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  /* ================= SHARE DETAILS ROWS ================= */
  const rows: Row[] = useMemo(() => {
    return projects.map(project => {
      const projectPayments = payments.filter(p => p.projectId === project.id);

      const totalSharePayment = projectPayments.reduce(
        (s, p) => s + Number(p.amount || 0), 0
      );

      const quitMemberIds = members
        .filter(m => m.status === "quit" && m.quitProjectId === project.id)
        .map(m => m.id);

      const quitRefund = projectPayments
        .filter(p => quitMemberIds.includes(p.memberId))
        .reduce((s, p) => s + Number(p.amount || 0), 0);

      const other = otherIncome
        .filter(o => o.projectId === project.id)
        .reduce((s, o) => s + Number(o.amount || 0), 0);

      const profit = profits
        .filter(p => p.projectId === project.id)
        .reduce((s, p) => s + Number(p.amount || 0), 0);

      const expense = expenses
        .filter(e => e.projectId === project.id)
        .reduce((s, e) => s + Number(e.amount || 0), 0);

      const assetValue = assets
        .filter(a => a.projectId === project.id)
        .reduce((s, a) => s + Number(a.value || 0), 0);

      const investment = investments
        .filter(i => i.projectId === project.id)
        .reduce((s, i) => s + Number(i.amount || 0), 0);

      const totalIncome = totalSharePayment + other + profit;
      const cashBalance = totalIncome - expense - quitRefund;
      const totalProjectValue = cashBalance + assetValue + investment;
      const totalShare = (totalSharePayment - quitRefund) / 1000;
      const shareValue = totalShare > 0 ? totalProjectValue / totalShare : 0;

      return {
        projectName: project.name,
        totalSharePayment,
        other,
        profit,
        totalIncome,
        expense,
        quitRefund,
        cashBalance,
        assetValue,
        investment,
        totalProjectValue,
        totalShare,
        shareValue,
      };
    });
  }, [projects, payments, expenses, otherIncome, assets, investments, profits, members]);

  /* ================= COLUMN TOTALS ================= */
  const totals = useMemo(() => {
    const sum = (k: keyof Row) =>
      rows.reduce((s, r) => s + Number(r[k] || 0), 0);

    const totalShares = sum("totalShare");
    const totalProjectValue = sum("totalProjectValue");

    return {
      totalSharePayment: sum("totalSharePayment"),
      other: sum("other"),
      profit: sum("profit"),
      totalIncome: sum("totalIncome"),
      expense: sum("expense"),
      quitRefund: sum("quitRefund"),
      cashBalance: sum("cashBalance"),
      assetValue: sum("assetValue"),
      investment: sum("investment"),
      totalProjectValue,
      totalShare: totalShares,
      shareValue: totalShares > 0 ? totalProjectValue / totalShares : 0,
    };
  }, [rows]);

  /* ================= INTEREST TOTALS ================= */
  const interestIncome = interestLedger
    .filter(i => i.type === "income")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const interestExpense = interestLedger
    .filter(i => i.type === "expense")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const interestBalance = interestIncome - interestExpense;
  const finalBalance = totals.cashBalance + interestBalance;

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* ================= SHARE DETAILS ================= */}
      <div className="bg-white p-8 rounded-xl border shadow mb-10">
        <h1 className="text-3xl font-bold mb-6">Share Details</h1>

        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-200">
            <tr>
              {[
                "Project","Share Payment","Other Income","Profit","Total Income",
                "Expense","Quit Refund","Cash Balance",
                "Asset","Investment","Total Project Value",
                "Total Shares","Share Value"
              ].map(h=>(
                <th key={h} className="border px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td className="border px-3 py-2">{r.projectName}</td>
                <td className="border px-3 py-2">₹{money(r.totalSharePayment)}</td>
                <td className="border px-3 py-2">₹{money(r.other)}</td>
                <td className="border px-3 py-2 text-green-700">₹{money(r.profit)}</td>
                <td className="border px-3 py-2">₹{money(r.totalIncome)}</td>
                <td className="border px-3 py-2 text-red-700">₹{money(r.expense)}</td>
                <td className="border px-3 py-2 text-red-700">₹{money(r.quitRefund)}</td>
                <td className="border px-3 py-2 font-semibold">₹{money(r.cashBalance)}</td>
                <td className="border px-3 py-2">₹{money(r.assetValue)}</td>
                <td className="border px-3 py-2">₹{money(r.investment)}</td>
                <td className="border px-3 py-2 font-bold">₹{money(r.totalProjectValue)}</td>
                <td className="border px-3 py-2">{money2(r.totalShare)}</td>
                <td className="border px-3 py-2 font-bold text-green-700">
                  ₹{money2(r.shareValue)}
                </td>
              </tr>
            ))}

            {/* ===== TOTAL ROW ===== */}
            <tr className="bg-gray-300 font-bold">
              <td className="border px-3 py-2">TOTAL</td>
              <td className="border px-3 py-2">₹{money(totals.totalSharePayment)}</td>
              <td className="border px-3 py-2">₹{money(totals.other)}</td>
              <td className="border px-3 py-2">₹{money(totals.profit)}</td>
              <td className="border px-3 py-2">₹{money(totals.totalIncome)}</td>
              <td className="border px-3 py-2 text-red-700">₹{money(totals.expense)}</td>
              <td className="border px-3 py-2 text-red-700">₹{money(totals.quitRefund)}</td>
              <td className="border px-3 py-2">₹{money(totals.cashBalance)}</td>
              <td className="border px-3 py-2">₹{money(totals.assetValue)}</td>
              <td className="border px-3 py-2">₹{money(totals.investment)}</td>
              <td className="border px-3 py-2">₹{money(totals.totalProjectValue)}</td>
              <td className="border px-3 py-2">{money2(totals.totalShare)}</td>
              <td className="border px-3 py-2 text-green-700">
                ₹{money2(totals.shareValue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= INTEREST SUMMARY ================= */}
      <div className="bg-white p-8 rounded-xl border shadow">
        <h2 className="text-2xl font-bold mb-4">Interest Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded">
            <p className="text-sm">Interest Income</p>
            <p className="text-xl font-bold text-green-700">₹{money(interestIncome)}</p>
          </div>

          <div className="border p-4 rounded">
            <p className="text-sm">Interest Expense</p>
            <p className="text-xl font-bold text-red-700">₹{money(interestExpense)}</p>
          </div>

          <div className="border p-4 rounded">
            <p className="text-sm">Interest Balance</p>
            <p className="text-xl font-bold">₹{money(interestBalance)}</p>
          </div>
        </div>

        <div className="mt-6 text-2xl font-bold text-green-800">
          GRAND TOTAL (Project Cash + Interest): ₹{money(finalBalance)}
        </div>
      </div>

    </div>
  );
}
