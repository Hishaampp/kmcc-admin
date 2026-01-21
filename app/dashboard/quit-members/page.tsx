"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { logAuditEvent } from "@/lib/auditLog"; // ✅ ADDED

/* ================= TYPES ================= */

type Member = {
  id: string;
  name: string;
  number: string;
  unitName: string;
  unitId?: string;
  status: string;
  quitProjects?: string[];
  quitHistory?: {
    [projectId: string]: {
      projectName: string;
      note: string;
      quitDate: any;
    };
  };
};

type QuitMemberEntry = Member & {
  quitProjectId: string;
  quitProjectName: string;
  quitNote: string;
  quitDate: any;
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

  const [quitMembers, setQuitMembers] = useState<QuitMemberEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMember, setSelectedMember] = useState<QuitMemberEntry | null>(null);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [showRejoinBox, setShowRejoinBox] = useState(false);
  const [rejoinMember, setRejoinMember] = useState<QuitMemberEntry | null>(null);

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

  const fetchQuitMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    const allMembers: Member[] = snap.docs.map(d => ({ 
      id: d.id, 
      ...(d.data() as any) 
    }));

    const quitData: QuitMemberEntry[] = [];
    
    allMembers.forEach(member => {
      const quitProjects = member.quitProjects || [];
      
      quitProjects.forEach((projectId: string) => {
        const quitHistory = member.quitHistory?.[projectId];
        
        if (quitHistory) {
          quitData.push({
            ...member,
            quitProjectId: projectId,
            quitProjectName: quitHistory.projectName || "Unknown",
            quitNote: quitHistory.note || "",
            quitDate: quitHistory.quitDate || null
          });
        }
      });
    });

    setQuitMembers(quitData);
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
    fetchQuitMembers();
    fetchPayments();
  }, []);

  /* ================= CORE FIX ================= */
  const getMemberPayments = (member: QuitMemberEntry) => {
    if (!member.quitProjectId) return [];

    return payments.filter(
      p =>
        p.memberId === member.id &&
        p.projectId === member.quitProjectId
    );
  };

  /* ================= ADD PAYMENT ================= */

  const addPayment = async () => {
    if (!selectedMember || !month || !year || !amount) {
      alert("Please fill all fields");
      return;
    }

    const newPaymentRef = await addDoc(collection(db, "payments"), {
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

    // 🔔 LOG AUDIT EVENT
    await logAuditEvent({
      action: "payment_added",
      collectionName: "payments",
      documentId: newPaymentRef.id,
      details: {
        memberName: selectedMember.name,
        memberNumber: selectedMember.number,
        projectName: selectedMember.quitProjectName,
        amount: `₹${new Intl.NumberFormat("en-IN").format(Number(amount))}`,
        period: `${month} ${year}`,
        note: "Payment for quit member",
      },
    });

    setAmount("");
    setMonth("");
    setYear("");
    setShowAddPayment(false);

    fetchPayments();
  };

  /* ================= REJOIN MEMBER ================= */

  const rejoinMemberToProject = async () => {
    if (!rejoinMember) return;

    const memberRef = doc(db, "members", rejoinMember.id);
    
    const currentQuitProjects = rejoinMember.quitProjects || [];
    const updatedQuitProjects = currentQuitProjects.filter(
      pId => pId !== rejoinMember.quitProjectId
    );

    const currentQuitHistory = { ...rejoinMember.quitHistory };
    if (currentQuitHistory[rejoinMember.quitProjectId]) {
      delete currentQuitHistory[rejoinMember.quitProjectId];
    }

    await updateDoc(memberRef, {
      quitProjects: updatedQuitProjects,
      quitHistory: currentQuitHistory,
    });

    // 🔔 LOG AUDIT EVENT
    await logAuditEvent({
      action: "member_rejoined",
      collectionName: "members",
      documentId: rejoinMember.id,
      details: {
        memberName: rejoinMember.name,
        memberNumber: rejoinMember.number,
        projectName: rejoinMember.quitProjectName,
        previousQuitNote: rejoinMember.quitNote || "No reason provided",
      },
    });

    setShowRejoinBox(false);
    setRejoinMember(null);
    fetchQuitMembers();

    alert(`✅ ${rejoinMember.name} has been rejoined to ${rejoinMember.quitProjectName}`);
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

      <h1 className="text-2xl font-bold mb-4 text-black">
        Quit Members Report
      </h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        {quitMembers.length === 0 && (
          <p className="text-black">No quit members found.</p>
        )}

        <ul className="space-y-2">
          {quitMembers.map((m, idx) => {
            const memberPayments = getMemberPayments(m);
            const totalPaid = memberPayments.reduce(
              (s, p) => s + Number(p.amount || 0),
              0
            );

            return (
              <li key={`${m.id}-${m.quitProjectId}-${idx}`} className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between">

                  <div>
                    <p className="font-semibold text-black">
                      {m.name} <span className="text-sm">#{m.number}</span>
                    </p>

                    <p className="text-sm text-black">
                      Unit: {m.unitName}
                    </p>

                    <p className="text-sm font-medium text-black">
                      Quit Project: {m.quitProjectName}
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
                    <p className="font-bold text-lg text-black">
                      ₹{totalPaid}
                    </p>

                    <button
                      onClick={() => setSelectedMember(m)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm block w-full"
                    >
                      View Payments
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMember(m);
                        setShowAddPayment(true);
                      }}
                      className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm block w-full"
                    >
                      Add Payment
                    </button>

                    <button
                      onClick={() => {
                        setRejoinMember(m);
                        setShowRejoinBox(true);
                      }}
                      className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm block w-full hover:bg-purple-700 transition"
                    >
                      Rejoin Project
                    </button>
                  </div>

                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* VIEW PAYMENTS MODAL */}
      {selectedMember && !showAddPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] max-h-[80vh] overflow-y-auto text-black">

            <h2 className="font-semibold mb-3 text-black">
              Payment History — {selectedMember.name}
            </h2>

            <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
              <p className="text-gray-600">Project: <span className="font-semibold text-black">{selectedMember.quitProjectName}</span></p>
            </div>

            {getMemberPayments(selectedMember).length === 0 && (
              <p className="text-black">No payments found.</p>
            )}

            <ul className="space-y-2">
              {getMemberPayments(selectedMember).map(p => (
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[380px] text-black">

            <h2 className="font-semibold mb-3 text-black">
              Add Payment — {selectedMember.name}
            </h2>

            <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
              <p className="text-gray-600">Project: <span className="font-semibold text-black">{selectedMember.quitProjectName}</span></p>
            </div>

            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border rounded w-full px-3 py-2 mb-3 text-black"
            >
              <option value="">Select Month</option>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>

            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="border rounded w-full px-3 py-2 mb-3 text-black"
            >
              <option value="">Select Year</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>

            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              className="border rounded w-full px-3 py-2 mb-3 text-black"
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

      {/* REJOIN MEMBER MODAL */}
      {showRejoinBox && rejoinMember && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-[450px] text-black">

            <h2 className="font-bold mb-4 text-xl text-purple-600">
              Rejoin Member to Project
            </h2>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-black">{rejoinMember.name}</p>
              <p className="text-sm text-gray-600">Member #{rejoinMember.number}</p>
              <p className="text-sm text-gray-600">Unit: {rejoinMember.unitName}</p>
              <p className="text-sm font-medium text-purple-700 mt-2">
                Will rejoin: {rejoinMember.quitProjectName}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Note:</strong> This member will be removed from the quit list 
                for "{rejoinMember.quitProjectName}" and will be able to participate 
                in this project again. Their payment history will be preserved.
              </p>
            </div>

            {rejoinMember.quitNote && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-xs text-gray-600 mb-1">Previous Quit Reason:</p>
                <p className="text-sm text-gray-800 italic">"{rejoinMember.quitNote}"</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowRejoinBox(false);
                  setRejoinMember(null);
                }} 
                className="border px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={rejoinMemberToProject} 
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
              >
                Confirm Rejoin
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}