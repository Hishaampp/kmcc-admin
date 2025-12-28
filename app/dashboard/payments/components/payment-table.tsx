"use client";

import { useState } from "react";
import { Payment } from "../types";

export default function PaymentsTable({
  payments,
  onDelete,
  onEdit
}: {
  payments: Payment[];
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<Payment>) => void;
}) {
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 2023 + 3 }, (_, i) => 2023 + i);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">

      <h2 className="text-lg font-semibold mb-3 text-gray-900">
        Payment Records
      </h2>

      <ul className="space-y-2">
        {payments.map(p => (
          <li
            key={p.id}
            className="p-3 border rounded bg-gray-50 flex justify-between items-center"
          >
            <span className="font-medium text-gray-900">
              {p.memberName} ({p.memberNumber}) — {p.unitName} — {p.month} {p.year}
            </span>

            <div className="flex gap-2 items-center">
              <span className="font-bold text-green-700">₹{p.amount}</span>

              <button
                onClick={() => {
                  setEditPayment(p);
                  setAmount(String(p.amount));
                  setMonth(p.month);
                  setYear(String(p.year || ""));
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(p.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editPayment && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[380px] shadow-lg text-gray-900">

            <h2 className="text-lg font-semibold mb-4">
              Edit Payment
            </h2>

            {/* Month */}
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            >
              <option value="">Select Month</option>
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Year */}
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            >
              <option value="">Select Year</option>
              {YEARS.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Amount */}
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              className="border rounded px-3 py-2 w-full text-black mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditPayment(null)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!month || !year || !amount) return;

                  onEdit(editPayment.id, {
                    amount: Number(amount),
                    month,
                    year: Number(year)
                  });

                  setEditPayment(null);
                }}
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
