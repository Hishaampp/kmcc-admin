"use client";

import { useRouter } from "next/navigation";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
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

      <PaymentsTable
        payments={payments}
        onDelete={deletePaymentById}
        onEdit={updatePayment}
      />
    </div>
  );
}
