"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Dashboard() {
  const logout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Navbar */}
      <div className="w-full bg-white border-b shadow-sm flex justify-between items-center px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-800">
          KMCC Admin Panel
        </h1>

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-10 px-6">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Welcome Super Admin 👋
        </h2>

        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Projects */}
          <Link
            href="/dashboard/projects"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Projects
            </h3>
            <p className="text-gray-700 mt-1">
              Create & manage running or completed projects.
            </p>
          </Link>

          {/* Units */}
          <Link
            href="/dashboard/units"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Units
            </h3>
            <p className="text-gray-700 mt-1">
              Register KMCC units and organize structure.
            </p>
          </Link>

          {/* Members */}
          <Link
            href="/dashboard/members"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Members
            </h3>
            <p className="text-gray-700 mt-1">
              Add & manage members under units.
            </p>
          </Link>

          {/* Payments Entry */}
          <Link
            href="/dashboard/payments"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Share Holder Payments
            </h3>
            <p className="text-gray-700 mt-1">
              Enter member payments and view history records.
            </p>
          </Link>

          <Link
  href="/dashboard/payments/other-project-payments"
  className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
>
  <h3 className="text-lg font-semibold text-gray-900">
    Other Project Payments
  </h3>
  <p className="text-gray-700 mt-1">
    Add payments directly under projects (without units / members)
  </p>
</Link>


          {/* Quit Members */}
          <Link
            href="/dashboard/quit-members"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Quit Members Report
            </h3>
            <p className="text-gray-700 mt-1">
              View members who quit and full records.
            </p>
          </Link>
        </div>

        {/* Payments Analytics Section */}
        <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4">
          Financial Reports 📊
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Monthly Dashboard */}
          <Link
            href="/dashboard/payments/monthly"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Report
            </h3>
            <p className="text-gray-700 mt-1">
              View monthly collection and pending details.
            </p>
          </Link>

          {/* Yearly Dashboard */}
          <Link
            href="/dashboard/payments/yearly"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Yearly Overview
            </h3>
            <p className="text-gray-700 mt-1">
              Track yearly performance and totals.
            </p>
          </Link>

          {/* Pending Report */}
          <Link
            href="/dashboard/payments/pending"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Payments
            </h3>
            <p className="text-gray-700 mt-1">
              View unpaid members and follow up.
            </p>
          </Link>

          {/* Add Expenses */}
          <Link
            href="/dashboard/payments/expenses"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Add Expenses
            </h3>
            <p className="text-gray-700 mt-1">
              Record expenses for projects or units.
            </p>
          </Link>

          {/* Monthly Balance */}
          <Link
            href="/dashboard/reports/monthly-balance"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Balance Sheet
            </h3>
            <p className="text-gray-700 mt-1">
              View Income - Expense summary and balance.
            </p>
          </Link>

          <Link
  href="/dashboard/payments/interest-income"
  className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
>
  <h3 className="text-lg font-semibold text-gray-900">
    Interest Income
  </h3>
  <p className="text-gray-700 mt-1">
    Add and track interest / bank credit incomes
  </p>
</Link>


          {/* ⭐ NEW — FULL PROJECT SUMMARY */}
          <Link
            href="/dashboard/reports/project-summary"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Project Full Summary
            </h3>
            <p className="text-gray-700 mt-1">
              View total of project → all units, lifetime totals.
            </p>
          </Link>

        </div>

      </div>
    </div>
  );
}
