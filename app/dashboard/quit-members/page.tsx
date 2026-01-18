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

/* ================= TYPES ================= */

type QuitProject = {
  projectId: string;
  projectName: string;
  quitNote?: string;
  quitDate?: any;
};

type Member = {
  id: string;
  name: string;
  number: string;
  unitName: string;
  unitId?: string;
  quitProjects?: QuitProject[];
};

type Payment = {
  id: string;
  memberId: string;
  projectId: string;
  projectName: string;
  unitName: string;
  memberName: string;
  memberNumber: string;
  amount: number;
  month: string;
  year?: number | string;
};

/* ================= COMPONENT ================= */

export default function QuitMembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedProject, setSelectedProject] = useState<QuitProject | null>(null);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from(
    { length: currentYear - 2023 + 3 },
    (_, i) => 2023 + i
  );

  /* ================= LOAD DATA ================= */

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    const data: Member[] = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter(m => m.quitProjects && m.quitProjects.length > 0);

    setMembers(data);
  };

  const fetchPayments = async () => {
    const snap = await getDocs(collection(db, "payments"));
    const data: Payment[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as any),
    }));
    setPayments(data);
  };

  useEffect(() => {
    fetchMembers();
    fetchPayments();
  }, []);

  /* ================= PAYMENT FILTER ================= */

  const getPaymentsForQuit = (memberId: string, projectId: string) => {
    return payments.filter(
      p => p.memberId === memberId && p.projectId === projectId
    );
  };

  /* ================= ADD PAYMENT ================= */

  const addPayment = async () => {
    if (!selectedMember || !selectedProject || !month || !year || !amount) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "payments"), {
      projectId: selectedProject.projectId,
      projectName: selectedProject.projectName,
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

    setAmount("");
    setMonth("");
    setYear("");
    setShowAddPayment(false);

    fetchPayments();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Quit Members Report
      </h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm">

        {members.length === 0 && (
          <p>No quit members found.</p>
        )}

        <ul className="space-y-3">
          {members.map(m =>
            m.quitProjects!.map(qp => {
              const memberPayments = getPaymentsForQuit(m.id, qp.projectId);
              const totalPaid = memberPayments.reduce(
                (s, p) => s + Number(p.amount || 0),
                0
              );

              return (
                <li
                  key={`${m.id}-${qp.projectId}`}
                  className="p-3 border rounded bg-gray-50"
                >
                  <div className="flex justify-between">

                    <div>
                      <p className="font-semibold">
                        {m.name} <span className="text-sm">#{m.number}</span>
                      </p>

                      <p className="text-sm">
                        Unit: {m.unitName}
                      </p>

                      <p className="text-sm font-medium">
                        Quit Project: {qp.projectName}
                      </p>

                      <p className="text-sm">
                        Quit Note: {qp.quitNote || "—"}
                      </p>

                      <p className="text-sm">
                        Quit Date:{" "}
                        {qp.quitDate?.toDate
                          ? qp.quitDate.toDate().toLocaleDateString()
                          : "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ₹{totalPaid}
                      </p>

                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setSelectedProject(qp);
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        View Payments
                      </button>

                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setSelectedProject(qp);
                          setShowAddPayment(true);
                        }}
                        className="mt-3 px-3 py-1 bg-green-600 text-white rounded text-sm"
                      >
                        Add Payment
                      </button>
                    </div>

                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* VIEW PAYMENTS MODAL */}
      {selectedMember && selectedProject && !showAddPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px] max-h-[80vh] overflow-y-auto">

            <h2 className="font-semibold mb-3">
              Payment History — {selectedMember.name}
            </h2>

            {getPaymentsForQuit(
              selectedMember.id,
              selectedProject.projectId
            ).length === 0 && <p>No payments found.</p>}

            <ul className="space-y-2">
              {getPaymentsForQuit(
                selectedMember.id,
                selectedProject.projectId
              ).map(p => (
                <li key={p.id} className="p-2 border rounded bg-gray-50">
                  <p className="font-medium">₹{p.amount}</p>
                  <p className="text-sm">
                    {p.month} {p.year}
                  </p>
                </li>
              ))}
            </ul>

            <div className="text-right mt-4">
              <button
                onClick={() => {
                  setSelectedMember(null);
                  setSelectedProject(null);
                }}
                className="px-3 py-1 border rounded"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {showAddPayment && selectedMember && selectedProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[380px]">

            <h2 className="font-semibold mb-3">
              Add Payment — {selectedMember.name}
            </h2>

            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border rounded w-full px-3 py-2 mb-3"
            >
              <option value="">Select Month</option>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>

            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="border rounded w-full px-3 py-2 mb-3"
            >
              <option value="">Select Year</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>

            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              className="border rounded w-full px-3 py-2 mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddPayment(false)}
                className="px-3 py-1 border rounded"
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
