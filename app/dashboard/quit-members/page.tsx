"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Member = {
  id: string;
  name: string;
  number: string;
  unitName: string;
  status: string;
  quitProjectId?: string;
  quitNote?: string;
  quitDate?: any;
};

type Payment = {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  month: string;
  projectName: string;
};

export default function QuitMembersPage() {
  const [quitMembers, setQuitMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Fetch Quit Members
  const fetchQuitMembers = async () => {
    const snap = await getDocs(collection(db, "members"));

    const data: Member[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((m) => m.status === "quit");

    setQuitMembers(data);
  };

  // Fetch all payments
  const fetchPayments = async () => {
    const snap = await getDocs(collection(db, "payments"));
    const data: Payment[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    setPayments(data);
  };

  useEffect(() => {
    fetchQuitMembers();
    fetchPayments();
  }, []);

  const getMemberPayments = (memberId: string) => {
    return payments.filter((p) => p.memberId === memberId);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Quit Members Report
      </h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        {quitMembers.length === 0 && (
          <p className="text-gray-600">No quit members found.</p>
        )}

        <ul className="space-y-2">
          {quitMembers.map((m) => {
            const memberPayments = getMemberPayments(m.id);
            const totalPaid = memberPayments.reduce(
              (sum, p) => sum + Number(p.amount || 0),
              0
            );

            return (
              <li key={m.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {m.name}{" "}
                      <span className="text-sm text-gray-600">
                        #{m.number}
                      </span>
                    </p>

                    <p className="text-sm text-gray-600">
                      Unit: {m.unitName}
                    </p>

                    <p className="text-sm text-red-700 font-medium">
                      Quit Project: {m.quitProjectId || "Unknown"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Quit Note: {m.quitNote || "—"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Quit Date:{" "}
                      {m.quitDate?.toDate
                        ? m.quitDate.toDate().toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-700 text-lg">
                      ₹{totalPaid}
                    </p>

                    <button
                      onClick={() => setSelectedMember(m)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      View Payments
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Payment History Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">
              Payment History — {selectedMember.name}
            </h2>

            {getMemberPayments(selectedMember.id).length === 0 && (
              <p className="text-gray-600">No payment history.</p>
            )}

            <ul className="space-y-2">
              {getMemberPayments(selectedMember.id).map((p) => (
                <li key={p.id} className="p-2 border rounded bg-gray-50">
                  <p className="font-medium text-gray-900">
                    ₹{p.amount}
                  </p>
                  <p className="text-sm text-gray-600">
                    {p.month} — {p.projectName}
                  </p>
                </li>
              ))}
            </ul>

            <div className="text-right mt-4">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-3 py-1 border rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
