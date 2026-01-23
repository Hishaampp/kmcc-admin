"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, "auditLogs"),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const actionColors: Record<string, string> = {
    // Members
    member_added: "bg-green-100 text-green-700",
    member_edited: "bg-blue-100 text-blue-700",
    member_deleted: "bg-red-100 text-red-700",
    member_quit: "bg-orange-100 text-orange-700",
    member_rejoined: "bg-purple-100 text-purple-700",
    
    // Payments
    payment_added: "bg-green-100 text-green-700",
    payment_deleted: "bg-red-100 text-red-700",
    
    // Expenses
    expense_added: "bg-red-100 text-red-700",
    expense_edited: "bg-blue-100 text-blue-700",
    expense_deleted: "bg-gray-100 text-gray-700",
    
    // Projects
    project_added: "bg-green-100 text-green-700",
    project_edited: "bg-blue-100 text-blue-700",
    project_deleted: "bg-red-100 text-red-700",
    
    // Units
    unit_added: "bg-green-100 text-green-700",
    unit_edited: "bg-blue-100 text-blue-700",
    unit_deleted: "bg-red-100 text-red-700",
    
    // Other Income
    other_income_added: "bg-green-100 text-green-700",
    other_income_deleted: "bg-red-100 text-red-700",
    
    // Profits
    profit_added: "bg-green-100 text-green-700",
    profit_deleted: "bg-red-100 text-red-700",
    
    // Assets
    asset_added: "bg-green-100 text-green-700",
    asset_deleted: "bg-red-100 text-red-700",
    
    // Investments
    investment_added: "bg-green-100 text-green-700",
    investment_deleted: "bg-red-100 text-red-700",
    
    // Documents
    document_uploaded: "bg-green-100 text-green-700",
    document_deleted: "bg-red-100 text-red-700",
  };

  const actionLabels: Record<string, string> = {
    // Members
    member_added: "Member Added",
    member_edited: "Member Edited",
    member_deleted: "Member Deleted",
    member_quit: "Member Quit",
    member_rejoined: "Member Rejoined",
    
    // Payments
    payment_added: "Payment Added",
    payment_deleted: "Payment Deleted",
    
    // Expenses
    expense_added: "Expense Added",
    expense_edited: "Expense Edited",
    expense_deleted: "Expense Deleted",
    
    // Projects
    project_added: "Project Added",
    project_edited: "Project Edited",
    project_deleted: "Project Deleted",
    
    // Units
    unit_added: "Unit Added",
    unit_edited: "Unit Edited",
    unit_deleted: "Unit Deleted",
    
    // Other Income
    other_income_added: "Other Income Added",
    other_income_deleted: "Other Income Deleted",
    
    // Profits
    profit_added: "Profit Added",
    profit_deleted: "Profit Deleted",
    
    // Assets
    asset_added: "Asset Added",
    asset_deleted: "Asset Deleted",
    
    // Investments
    investment_added: "Investment Added",
    investment_deleted: "Investment Deleted",
    
    // Documents
    document_uploaded: "Document Uploaded",
    document_deleted: "Document Deleted",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6 text-black">Audit Logs</h1>

      {loading ? (
        <p className="text-gray-600">Loading audit logs...</p>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {logs.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No audit logs found</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="border-b p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {log.performedBy}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {log.timestamp?.toDate?.()?.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "full",
                        timeStyle: "short"
                      }) || "Unknown time"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Collection: {log.collectionName} • ID: {log.documentId || "N/A"}
                    </p>
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                    View Details
                  </summary>
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(log.details || {}).map(([key, value]) => (
                          <tr key={key} className="border-b last:border-b-0">
                            <td className="py-2 pr-4 text-gray-600 font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </td>
                            <td className="py-2 text-gray-800">
                              {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}