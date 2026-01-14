"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Dashboard() {
  const logout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const Card = ({
    href,
    title,
    description,
  }: {
    href: string;
    title: string;
    description: string;
  }) => (
    <Link
      href={href}
      className="block p-6 bg-white rounded-xl border shadow-sm hover:bg-gray-50 hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-gray-700 mt-1 text-sm">
        {description}
      </p>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ================= TOP BAR ================= */}
      <div className="w-full bg-white border-b shadow-sm flex justify-between items-center px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-800">
          KMCC Admin Panel
        </h1>

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-7xl mx-auto py-10 px-6">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Welcome Super Admin 👋
        </h2>

        {/* ================= CORE MANAGEMENT ================= */}
        <Section title="Core Management">
          <Card
            href="/dashboard/projects"
            title="Manage Projects"
            description="Create, edit and manage all projects."
          />
          <Card
            href="/dashboard/units"
            title="Manage Units"
            description="Create and organize KMCC units."
          />
          <Card
            href="/dashboard/members"
            title="Manage Members"
            description="Add and manage members under units."
          />
          <Card
            href="/dashboard/quit-members"
            title="Quit Members"
            description="Track members who exited projects."
          />
        </Section>

        {/* ================= PAYMENTS ================= */}
        <Section title="Payments & Collections">
          <Card
            href="/dashboard/payments"
            title="Share Holder Payments"
            description="Enter and manage member payments."
          />
          <Card
            href="/dashboard/payments/other-project-payments"
            title="Other Project Payments"
            description="Payments without members or units."
          />
          <Card
            href="/dashboard/payments/expenses"
            title="Project Expenses"
            description="Record and manage project expenses."
          />
          <Card
            href="/dashboard/payments/interest-income"
            title="Interest Ledger"
            description="Independent interest income & expense."
          />
        </Section>

        {/* ================= ASSETS & FINANCE ================= */}
        <Section title="Assets & Finance">
          <Card
            href="/dashboard/assets"
            title="Project Assets"
            description="Maintain project asset values."
          />
          <Card
            href="/dashboard/finance/investments"
            title="Project Investments"
            description="Add and track investments per project."
          />
          <Card
            href="/dashboard/finance/profits"
            title="Project Profits"
            description="Record profits earned from projects."
          />
        </Section>

        {/* ================= REPORTS ================= */}
        <Section title="Reports & Analytics">
          <Card
            href="/dashboard/payments/yearly"
            title="Yearly Overview"
            description="Year-wise income and expense report."
          />
          <Card
            href="/dashboard/reports/monthly-balance"
            title="Monthly Balance Sheet"
            description="Income, expense and net balance."
          />
          <Card
            href="/dashboard/reports/project-summary"
            title="Project Full Summary"
            description="Lifetime project performance."
          />
          <Card
            href="/dashboard/reports/share-details"
            title="Share Details"
            description="Share value, assets & cash balance."
          />
        </Section>


      </div>
    </div>
  );
}

/* ================= REUSABLE SECTION ================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
}
