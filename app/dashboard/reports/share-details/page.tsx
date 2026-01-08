"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

/* ================= FORMATTERS ================= */
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const money2 = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function ShareDetailsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [otherIncome, setOtherIncome] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      const [
        p, pay, exp, other, asset, invest, profit, mem
      ] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "expenses")),
        getDocs(collection(db, "projectOtherPayments")),
        getDocs(collection(db, "projectAssets")),
        getDocs(collection(db, "projectInvestments")),
        getDocs(collection(db, "projectProfits")),
        getDocs(collection(db, "members")),
      ]);

      setProjects(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(pay.docs.map(d => ({ id: d.id, ...d.data() })));
      setExpenses(exp.docs.map(d => ({ id: d.id, ...d.data() })));
      setOtherIncome(other.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssets(asset.docs.map(d => ({ id: d.id, ...d.data() })));
      setInvestments(invest.docs.map(d => ({ id: d.id, ...d.data() })));
      setProfits(profit.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(mem.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  /* ================= ROWS ================= */
  const rows = useMemo(() => {
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

      const totalIncome =
        totalSharePayment + other + profit;

      const cashBalance =
        totalIncome - expense - quitRefund;

      const totalProjectValue =
        cashBalance + assetValue + investment;

      const totalShare =
        (totalSharePayment - quitRefund) / 1000;

      const currentShareValue =
        totalShare > 0 ? totalProjectValue / totalShare : 0;

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
        currentShareValue,
      };
    });
  }, [projects, payments, expenses, otherIncome, assets, investments, profits, members]);

  /* ================= ⭐ GRAND TOTALS ================= */
  const totals = useMemo(() => {
    const sum = (key: keyof typeof rows[0]) =>
      rows.reduce((s, r) => s + Number(r[key] || 0), 0);

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
      shareValue:
        totalShares > 0 ? totalProjectValue / totalShares : 0,
    };
  }, [rows]);

  /* ================= PDF EXPORT ================= */
  const exportPDF = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) return alert("PDF content not found");

    const dataUrl = await toPng(element, { backgroundColor: "#fff", pixelRatio: 2 });

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });

    const img = new Image();
    img.src = dataUrl;
    await new Promise(res => (img.onload = res));

    const pxToMm = (px:number)=>px*0.264583;
    const w = pxToMm(img.width);
    const h = pxToMm(img.height);

    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const scale = Math.min(pw / w, ph / h);
    pdf.addImage(dataUrl,"PNG",(pw-w*scale)/2,(ph-h*scale)/2,w*scale,h*scale);
    pdf.save("KMCC-Share-Details.pdf");
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Share Details</h1>
        <button onClick={exportPDF} className="px-5 py-2 bg-black text-white rounded">
          Export PDF
        </button>
      </div>

      <div id="pdf-content" className="bg-white p-8 rounded-xl border shadow">
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
                <td className="border px-3 py-2 font-semibold">₹{money(r.totalIncome)}</td>
                <td className="border px-3 py-2 text-red-700">₹{money(r.expense)}</td>
                <td className="border px-3 py-2 text-red-700">₹{money(r.quitRefund)}</td>
                <td className="border px-3 py-2 font-semibold">₹{money(r.cashBalance)}</td>
                <td className="border px-3 py-2">₹{money(r.assetValue)}</td>
                <td className="border px-3 py-2">₹{money(r.investment)}</td>
                <td className="border px-3 py-2 font-bold">₹{money(r.totalProjectValue)}</td>
                <td className="border px-3 py-2">{money2(r.totalShare)}</td>
                <td className="border px-3 py-2 font-bold text-green-700">
                  ₹{money2(r.currentShareValue)}
                </td>
              </tr>
            ))}

            {/* ⭐ TOTAL ROW */}
            <tr className="bg-gray-300 font-bold">
              <td className="border px-3 py-2">TOTAL</td>
              <td className="border px-3 py-2">₹{money(totals.totalSharePayment)}</td>
              <td className="border px-3 py-2">₹{money(totals.other)}</td>
              <td className="border px-3 py-2 text-green-700">₹{money(totals.profit)}</td>
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
    </div>
  );
}
