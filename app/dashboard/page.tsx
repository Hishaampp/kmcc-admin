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
              Add members under units with details.
            </p>
          </Link>

          {/* Payments */}
          <Link
            href="/dashboard/contributions"
            className="block p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Record Payments
            </h3>
            <p className="text-gray-700 mt-1">
              Manually record payment amounts and history.
            </p>
          </Link>

          {/* Quit Members */}
<Link
  href="/dashboard/quit-members"
  className="block p-4 border rounded-xl shadow-sm bg-white hover:bg-gray-50"
>
  <h2 className="font-semibold text-gray-800">Quit Members Report</h2>
  <p className="text-sm text-gray-600">
    View members who quit and full payment history.
  </p>
</Link>


        </div>
      </div>
    </div>
  );
}
