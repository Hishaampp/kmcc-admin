"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

type Member = {
  id: string;
  name: string;
  number: string;
  unitName: string;
  unitId?: string;
  status: string;
  quitProjectId?: string;
  quitProjectName?: string;
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
  unitName: string;
  year?: number | string;
};

export default function QuitMembersPage() {
  const router = useRouter();

  const [quitMembers, setQuitMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 2023 + 3 }, (_, i) => 2023 + i);

  const fetchQuitMembers = async () => {
    const snap = await getDocs(collection(db, "members"));

    const data: Member[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((m) => m.status === "quit");

    setQuitMembers(data);
  };

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

  const addPayment = async () => {
    if (!selectedMember || !month || !year || !amount) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "payments"), {
      projectId: selectedMember.quitProjectId || "",
      projectName: selectedMember.quitProjectName || "Unknown",
      unitId: selectedMember.unitId || "",
      unitName: selectedMember.unitName,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberNumber: selectedMember.number,
      month,
      year,
      amount: Number(amount),
      createdAt: serverTimestamp(),
    });

    alert("Payment Added Successfully");

    setAmount("");
    setMonth("");
    setYear("");
    setShowAddPayment(false);

    fetchPayments();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* 🔙 Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-black mb-4">
        Quit Members Report
      </h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        {quitMembers.length === 0 && (
          <p className="text-black">No quit members found.</p>
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
                    <p className="font-semibold text-black">
                      {m.name} <span className="text-sm text-black">#{m.number}</span>
                    </p>

                    <p className="text-sm text-black">
                      Unit: {m.unitName}
                    </p>

                    <p className="text-sm text-black font-medium">
                      Quit Project: {m.quitProjectName || m.quitProjectId || "Unknown"}
                    </p>

                    <p className="text-sm text-black">
                      Quit Note: {m.quitNote || "—"}
                    </p>

                    <p className="text-sm text-black">
                      Quit Date:{" "}
                      {m.quitDate?.toDate
                        ? m.quitDate.toDate().toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-black text-lg">
                      ₹{totalPaid}
                    </p>

                    <button
                      onClick={() => setSelectedMember(m)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      View Payments
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMember(m);
                        setShowAddPayment(true);
                      }}
                      className="mt-4 px-3 py-1 bg-green-600 text-white rounded text-sm"
                    >
                      Add Payment
                    </button>
                  </div>

                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* VIEW PAYMENTS MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg max-h-[85vh] overflow-y-auto">

            <h2 className="text-lg font-semibold mb-2 text-black">
              Payment History — {selectedMember.name}
            </h2>

            {getMemberPayments(selectedMember.id).length === 0 && (
              <p className="text-black">No payment history.</p>
            )}

            <ul className="space-y-2">
              {getMemberPayments(selectedMember.id).map((p) => (
                <li key={p.id} className="p-2 border rounded bg-gray-50">
                  <p className="font-medium text-black">
                    ₹{p.amount}
                  </p>
                  <p className="text-sm text-black">
                    {p.month} {p.year} — {p.projectName}
                  </p>
                </li>
              ))}
            </ul>

            <div className="text-right mt-4">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-3 py-1 border rounded text-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {showAddPayment && selectedMember && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[380px] shadow-lg">

            <h2 className="text-lg font-semibold mb-3 text-black">
              Add Payment — {selectedMember.name}
            </h2>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            >
              <option value="">Select Month</option>
              {MONTHS.map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            >
              <option value="">Select Year</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="border rounded px-3 py-2 w-full text-black mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddPayment(false)}
                className="px-3 py-1 border rounded text-black"
              >
                Cancel
              </button>

              <button
                onClick={addPayment}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
