"use client";

interface Props {
  totalAmount: number;
  totalPayments: number;
  totalMembers: number;
  totalUnits: number;
}

export default function SummaryCards({
  totalAmount,
  totalPayments,
  totalMembers,
  totalUnits
}: Props) {
  const card = (title: string, value: string | number) => (
    <div className="bg-white border rounded-xl shadow-sm p-4">
      <p className="text-sm text-gray-600">{title}</p>
      <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {card("Total Amount Collected", `₹${totalAmount}`)}
      {card("Total Payments Recorded", totalPayments)}
      {card("Members Participated", totalMembers)}
      {card("Units Participated", totalUnits)}
    </div>
  );
}
