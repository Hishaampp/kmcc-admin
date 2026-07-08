"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

const money2 = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

const JOIN_MONTHS: Record<string, string> = {
  "1": "January", "2": "February", "3": "March", "4": "April",
  "5": "May", "6": "June", "7": "July", "8": "August",
  "9": "September", "10": "October", "11": "November", "12": "December",
};

// ✅ NEW: ₹ value per whole share — matches the /1000 convention used in
// reports/share-details/page.tsx (totalShare = totalSharePayment / 1000)
const SHARE_UNIT = 1000;

type Payment = {
  id: string;
  projectId: string;
  projectName: string;
  memberId: string;
  month: string;
  year: number | string;
  amount: number;
  createdAt?: any;
};

type Props = {
  member: any;
  payments: Payment[];
  loading: boolean;
  onClose: () => void;
  // ✅ NEW: full members list, needed to replicate the same quit-refund
  // logic used in reports/share-details/page.tsx when computing current share value
  allMembers?: any[];
};

// ✅ NEW: per-project share value row for this member
type ShareRow = {
  projectId: string;
  projectName: string;
  totalPaid: number;
  baseShareValue: number;
  totalShares: number;
  currentShareValue: number;
  currentValue: number;
  quit: boolean;
};

// ✅ NEW: computes, for one member, the current share value of every project
// they've paid into — reusing the exact formula from reports/share-details/page.tsx
// (cash balance + assets + investments, divided by shares outstanding),
// scoped down with targeted `where("projectId","==",...)` queries instead of
// pulling every collection in full.
async function computeMemberShareRows(
  memberId: string,
  memberPayments: Payment[],
  allMembers: any[]
): Promise<ShareRow[]> {
  const memberProjectTotals: Record<string, { projectName: string; total: number }> = {};
  memberPayments.forEach(p => {
    const key = p.projectId;
    if (!key) return;
    if (!memberProjectTotals[key]) {
      memberProjectTotals[key] = { projectName: p.projectName || "Unknown Project", total: 0 };
    }
    memberProjectTotals[key].total += Number(p.amount || 0);
  });

  const projectIds = Object.keys(memberProjectTotals);
  if (projectIds.length === 0) return [];

  const rows = await Promise.all(
    projectIds.map(async (projectId) => {
      const [payQ, expQ, otherQ, profitQ, assetQ, investQ] = await Promise.all([
        getDocs(query(collection(db, "payments"), where("projectId", "==", projectId))),
        getDocs(query(collection(db, "expenses"), where("projectId", "==", projectId))),
        getDocs(query(collection(db, "projectOtherPayments"), where("projectId", "==", projectId))),
        getDocs(query(collection(db, "projectProfits"), where("projectId", "==", projectId))),
        getDocs(query(collection(db, "projectAssets"), where("projectId", "==", projectId))),
        getDocs(query(collection(db, "projectInvestments"), where("projectId", "==", projectId))),
      ]);

      const projectPayments = payQ.docs.map(d => d.data()) as any[];
      const expenses = expQ.docs.map(d => d.data()) as any[];
      const otherIncome = otherQ.docs.map(d => d.data()) as any[];
      const profits = profitQ.docs.map(d => d.data()) as any[];
      const assets = assetQ.docs.map(d => d.data()) as any[];
      const investments = investQ.docs.map(d => d.data()) as any[];

      const totalSharePayment = projectPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

      const quitMemberIds = allMembers
        .filter(m => (m.quitProjects || []).includes(projectId))
        .map(m => m.id);

      const quitRefund = projectPayments
        .filter((p: any) => quitMemberIds.includes(p.memberId))
        .reduce((s, p: any) => s + Number(p.amount || 0), 0);

      const otherTotal = otherIncome.reduce((s, o) => s + Number(o.amount || 0), 0);
      const profitTotal = profits.reduce((s, p) => s + Number(p.amount || 0), 0);
      const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const assetTotal = assets.reduce((s, a) => s + Number(a.value || 0), 0);
      const investmentTotal = investments.reduce((s, i) => s + Number(i.amount || 0), 0);

      const totalIncome = totalSharePayment + otherTotal + profitTotal;
      const cashBalance = totalIncome - expenseTotal - quitRefund;
      const totalProjectValue = cashBalance + assetTotal + investmentTotal;
      const totalProjectShares = (totalSharePayment - quitRefund) / SHARE_UNIT;
      const currentShareValue = totalProjectShares > 0 ? totalProjectValue / totalProjectShares : 0;

      const memberInfo = memberProjectTotals[projectId];
      const memberShares = memberInfo.total / SHARE_UNIT;
      const isQuitFromThisProject = quitMemberIds.includes(memberId);
      const currentValue = isQuitFromThisProject ? 0 : memberShares * currentShareValue;

      return {
        projectId,
        projectName: memberInfo.projectName,
        totalPaid: memberInfo.total,
        baseShareValue: SHARE_UNIT,
        totalShares: memberShares,
        currentShareValue,
        currentValue,
        quit: isQuitFromThisProject,
      } as ShareRow;
    })
  );

  return rows.sort((a, b) => b.totalPaid - a.totalPaid);
}

export default function MemberDetailsModal({ member, payments, loading, onClose, allMembers = [] }: Props) {
  const totalDeposited = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Group payments by project
  const projectMap: Record<string, { projectName: string; total: number; count: number }> = {};
  payments.forEach(p => {
    const key = p.projectId || "unknown";
    if (!projectMap[key]) {
      projectMap[key] = { projectName: p.projectName || "Unknown Project", total: 0, count: 0 };
    }
    projectMap[key].total += Number(p.amount || 0);
    projectMap[key].count += 1;
  });
  const projectRows = Object.entries(projectMap)
    .map(([projectId, v]) => ({ projectId, ...v }))
    .sort((a, b) => b.total - a.total);

  // Most recent payments first
  const sortedPayments = [...payments].sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return Number(b.year) - Number(a.year);
  });

  const quitProjects: string[] = member.quitProjects || [];

  // ✅ NEW: share value state
  const [shareRows, setShareRows] = useState<ShareRow[]>([]);
  const [loadingShareRows, setLoadingShareRows] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (payments.length === 0) {
      setShareRows([]);
      return;
    }
    setLoadingShareRows(true);
    computeMemberShareRows(member.id, payments, allMembers)
      .then(setShareRows)
      .catch(err => {
        console.error("Failed to compute share values", err);
        setShareRows([]);
      })
      .finally(() => setLoadingShareRows(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id, payments, loading]);

  const shareGrandTotal = shareRows.reduce(
    (acc, r) => ({
      totalPaid: acc.totalPaid + r.totalPaid,
      totalShares: acc.totalShares + r.totalShares,
      currentShareValue: acc.currentShareValue + r.currentShareValue,
      currentValue: acc.currentValue + r.currentValue,
    }),
    { totalPaid: 0, totalShares: 0, currentShareValue: 0, currentValue: 0 }
  );

  // ✅ NEW: opens a clean, full-page printable statement in a new tab
  const printStatement = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const rowsHtml = shareRows
      .map(
        r => `
      <tr>
        <td>${r.projectName}${r.quit ? " (Quit)" : ""}</td>
        <td style="text-align:right">₹${money(r.totalPaid)}</td>
        <td style="text-align:right">₹${money(r.baseShareValue)}</td>
        <td style="text-align:right">${r.totalShares.toFixed(2)}</td>
        <td style="text-align:right">₹${money2(r.currentShareValue)}</td>
        <td style="text-align:right">₹${money(r.currentValue)}</td>
      </tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>${member.name} - Share Statement</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .sub { color: #555; margin-bottom: 24px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #999; padding: 8px 10px; font-size: 13px; }
            th { background: #f2f2f2; text-align: left; }
            tfoot td { font-weight: bold; background: #f7f7f7; }
            @media print {
              @page { size: A4 landscape; margin: 16mm; }
            }
          </style>
        </head>
        <body>
          <h1>${member.name}</h1>
          <div class="sub">Member #${member.number} · ${member.unitName || ""}</div>
          <table>
            <thead>
              <tr>
                <th>Project</th><th>Total Paid</th><th>Share Value</th>
                <th>Total Shares</th><th>Current Share Value</th><th>Total Value</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot>
              <tr>
                <td>Grand Total</td>
                <td style="text-align:right">₹${money(shareGrandTotal.totalPaid)}</td>
                <td style="text-align:right">₹${money(SHARE_UNIT)}</td>
                <td style="text-align:right">${shareGrandTotal.totalShares.toFixed(2)}</td>
                <td style="text-align:right">₹${money2(shareGrandTotal.currentShareValue)}</td>
                <td style="text-align:right">₹${money(shareGrandTotal.currentValue)}</td>
              </tr>
            </tfoot>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-black">

        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{member.name}</h2>
              <p className="text-sm text-gray-600">
                Member #{member.number} · {member.unitName}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-black text-xl leading-none">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <div>
              <p className="text-xs text-gray-500">Contact Number</p>
              <p className="font-semibold">{member.contactNumber || "Not Added"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="font-semibold">
                {member.joinMonth ? JOIN_MONTHS[member.joinMonth] : ""} {member.joinYear || ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nominee</p>
              <p className="font-semibold">{member.nomineeName || "Not Added"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nominee Contact</p>
              <p className="font-semibold">{member.nomineeContact || "Not Added"}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">Total Deposited (All Projects)</p>
            <p className="text-3xl font-bold text-green-700">₹{money(totalDeposited)}</p>
            <p className="text-xs text-green-700 mt-1">
              {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Project-wise Contribution</h3>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : projectRows.length === 0 ? (
              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {projectRows.map(row => {
                  const hasQuit = quitProjects.includes(row.projectId);
                  return (
                    <div key={row.projectId} className="flex justify-between items-center border rounded p-3">
                      <div>
                        <p className="font-medium">{row.projectName}</p>
                        <p className="text-xs text-gray-500">
                          {row.count} payment{row.count !== 1 ? "s" : ""}
                          {hasQuit && <span className="text-orange-600 ml-2">· Quit from this project</span>}
                        </p>
                      </div>
                      <p className="font-bold">₹{money(row.total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ✅ NEW: SHARE VALUE SUMMARY */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Share Value Summary</h3>
              <button
                onClick={printStatement}
                disabled={shareRows.length === 0}
                className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🖨️ Print Statement
              </button>
            </div>

            {loadingShareRows ? (
              <p className="text-gray-500 text-sm">Calculating share values...</p>
            ) : shareRows.length === 0 ? (
              <p className="text-gray-500 text-sm">No share value data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left">Project</th>
                      <th className="border px-2 py-1 text-right">Total Paid</th>
                      <th className="border px-2 py-1 text-right">Share Value</th>
                      <th className="border px-2 py-1 text-right">Total Shares</th>
                      <th className="border px-2 py-1 text-right">Current Share Value</th>
                      <th className="border px-2 py-1 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareRows.map(r => (
                      <tr key={r.projectId}>
                        <td className="border px-2 py-1">
                          {r.projectName}
                          {r.quit && <span className="text-orange-600 text-xs ml-1">(Quit)</span>}
                        </td>
                        <td className="border px-2 py-1 text-right">₹{money(r.totalPaid)}</td>
                        <td className="border px-2 py-1 text-right">₹{money(r.baseShareValue)}</td>
                        <td className="border px-2 py-1 text-right">{r.totalShares.toFixed(2)}</td>
                        <td className="border px-2 py-1 text-right">₹{money2(r.currentShareValue)}</td>
                        <td className="border px-2 py-1 text-right font-semibold">₹{money(r.currentValue)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border px-2 py-1">Grand Total</td>
                      <td className="border px-2 py-1 text-right">₹{money(shareGrandTotal.totalPaid)}</td>
                      <td className="border px-2 py-1 text-right">₹{money(SHARE_UNIT)}</td>
                      <td className="border px-2 py-1 text-right">{shareGrandTotal.totalShares.toFixed(2)}</td>
                      <td className="border px-2 py-1 text-right">₹{money2(shareGrandTotal.currentShareValue)}</td>
                      <td className="border px-2 py-1 text-right">₹{money(shareGrandTotal.currentValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {quitProjects.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-orange-700">Quit History</h3>
              <div className="space-y-2">
                {quitProjects.map((pId: string) => {
                  const info = member.quitHistory?.[pId];
                  return (
                    <div key={pId} className="border border-orange-200 bg-orange-50 rounded p-3 text-sm">
                      <p className="font-medium">{info?.projectName || pId}</p>
                      {info?.note && <p className="text-gray-600 mt-1">Reason: {info.note}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Payment History</h3>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : sortedPayments.length === 0 ? (
              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left">Project</th>
                      <th className="border px-2 py-1 text-left">Month</th>
                      <th className="border px-2 py-1 text-left">Year</th>
                      <th className="border px-2 py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map(p => (
                      <tr key={p.id}>
                        <td className="border px-2 py-1">{p.projectName}</td>
                        <td className="border px-2 py-1">{p.month}</td>
                        <td className="border px-2 py-1">{p.year}</td>
                        <td className="border px-2 py-1 text-right font-medium">₹{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-100 transition">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}