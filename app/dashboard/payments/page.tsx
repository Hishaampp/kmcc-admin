"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import usePayments from "./hooks/use-payments";
import PaymentForm from "./components/payment-form";
import SummaryCards from "./components/summary-cards";
import PaymentsTable from "./components/payment-table";

export default function PaymentsPage() {
  const router = useRouter();

  const {
    loading,
    projects,
    units,
    members,
    payments,
    addPayment,
    updatePayment,
    deletePaymentById,
  } = usePayments();

  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  const totalAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const uniqueMembers = new Set(payments.map((p) => p.memberId)).size;
  const uniqueUnits = new Set(payments.map((p) => p.unitId)).size;

  const handleAddPayment = async (data: any) => {
    const project = projects.find((p) => p.id === data.projectId);
    const unit = units.find((u) => u.id === data.unitId);
    const member = members.find((m) => m.id === data.memberId);

    await addPayment({
      projectId: data.projectId,
      projectName: project?.name || "",
      unitId: data.unitId,
      unitName: unit?.name || "",
      memberId: data.memberId,
      memberName: member?.name || "",
      memberNumber: member?.number || "",
      month: data.month,
      year: data.year,
      amount: Number(data.amount),
    });
  };

  const monthIndex = (m?: string) => {
    if (!m) return -1;
    const months = [
      "january","february","march","april","may","june",
      "july","august","september","october","november","december"
    ];
    return months.indexOf(m.toLowerCase());
  };

  const filteredPayments = payments
    .filter((p) => {
      const keyword = search.trim().toLowerCase();
      if (!keyword) return true;

      const fields = [
        p.memberName,
        p.memberNumber,
        p.unitName,
        p.projectName,
        p.month,
        p.year ? String(p.year) : "",
      ];

      return fields.some((field) =>
        (field || "").toString().toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => {
      const yearA = a.year ? Number(a.year) : (a.createdAt?.toDate?.().getFullYear() || 0);
      const yearB = b.year ? Number(b.year) : (b.createdAt?.toDate?.().getFullYear() || 0);
      if (yearA !== yearB) return yearB - yearA;

      const mA = monthIndex(a.month);
      const mB = monthIndex(b.month);
      if (mA !== mB) return mB - mA;

      const dA = a.createdAt?.toDate?.().getTime?.() || 0;
      const dB = b.createdAt?.toDate?.().getTime?.() || 0;
      return dB - dA;
    });

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Payments Dashboard
      </h1>

      <SummaryCards
        totalAmount={totalAmount}
        totalPayments={payments.length}
        totalMembers={uniqueMembers}
        totalUnits={uniqueUnits}
      />

      <PaymentForm
        projects={projects}
        units={units}
        members={members}
        onSubmit={handleAddPayment}
      />

      <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
        <input
          placeholder="Search Member / Number / Unit / Project / Month / Year"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full text-black placeholder-gray-700"
        />
      </div>

      <PaymentsTable
        payments={filteredPayments}
        onDelete={deletePaymentById}
        onEdit={updatePayment}
      />
    </div>
  );
}
