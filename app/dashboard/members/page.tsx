"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function MembersPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [selectedUnit, setSelectedUnit] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberNumber, setMemberNumber] = useState("");

  const [search, setSearch] = useState("");

  // Quit States
  const [showQuitBox, setShowQuitBox] = useState(false);
  const [quitMemberId, setQuitMemberId] = useState("");
  const [projectIdForQuit, setProjectIdForQuit] = useState("");
  const [quitNote, setQuitNote] = useState("");

  // Fetch Units
  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // Fetch Members
  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMembers(data);
  };

  // Fetch Projects
  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchUnits();
    fetchMembers();
    fetchProjects();
  }, []);

  // Add Member
  const addMember = async () => {
    if (!memberName.trim() || !memberNumber.trim() || !selectedUnit) return;

    const unit = units.find((u) => u.id === selectedUnit);

    await addDoc(collection(db, "members"), {
      name: memberName,
      number: memberNumber,
      unitId: selectedUnit,
      unitName: unit?.name || "",
      status: "active",
      createdAt: serverTimestamp(),
    });

    setMemberName("");
    setMemberNumber("");
    setSelectedUnit("");
    fetchMembers();
  };

  // Quit Member
  const markAsQuit = async () => {
    if (!quitMemberId || !projectIdForQuit) {
      alert("Please select project to quit from.");
      return;
    }

    const member = members.find((m) => m.id === quitMemberId);
    const project = projects.find((p) => p.id === projectIdForQuit);

    if (!member) {
      alert("Member not found.");
      return;
    }

    if (member.status === "quit") {
      alert("This member is already marked as quit.");
      return;
    }

    await updateDoc(doc(db, "members", quitMemberId), {
      status: "quit",
      quitProjectId: projectIdForQuit,
      quitProjectName: project?.name || "",
      quitUnitId: member.unitId || "",
      quitUnitName: member.unitName || "",
      quitDate: serverTimestamp(),
      quitNote: quitNote || "",
    });

    setShowQuitBox(false);
    setQuitNote("");
    setQuitMemberId("");
    setProjectIdForQuit("");

    fetchMembers();
  };

  // Filter + Search
  const filteredMembers = members.filter((m) => {
    const matchUnit = selectedUnit === "" ? true : m.unitId === selectedUnit;

    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.number?.toLowerCase().includes(search.toLowerCase());

    return matchUnit && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Manage Members
      </h1>

      {/* Add Member */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Add New Member
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="border rounded px-3 py-2 w-full text-gray-900"
          >
            <option value="">Select Unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <input
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
            placeholder="Member Number"
            className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
          />

          <input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="Member Name"
            className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
          />
        </div>

        <button
          onClick={addMember}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Member
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <input
          placeholder="Search by name or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full placeholder-gray-700 text-gray-900"
        />

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-60 text-gray-900"
        >
          <option value="">All Units</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Members List
        </h2>

        {filteredMembers.length === 0 && (
          <p className="text-gray-600">No members found.</p>
        )}

        <ul className="space-y-2">
          {filteredMembers.map((m) => (
            <li
              key={m.id}
              className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {m.name}
                  {m.status === "quit" && (
                    <span className="ml-2 text-sm text-red-600">(Quit)</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">#{m.number}</p>
                <p className="text-xs text-gray-500">{m.unitName}</p>
              </div>

              {m.status === "active" && (
                <button
                  onClick={() => {
                    setQuitMemberId(m.id);
                    setShowQuitBox(true);
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
                >
                  Mark Quit
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Quit Popup */}
{showQuitBox && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
    <div className="bg-white p-6 rounded-xl w-[360px] shadow-lg text-gray-900">

      <h2 className="text-lg font-semibold mb-3 text-gray-900">
        Mark Member as Quit
      </h2>

      <label className="text-sm font-medium text-gray-800">
        Select Project
      </label>
      <select
        value={projectIdForQuit}
        onChange={(e) => setProjectIdForQuit(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-3 text-gray-900"
      >
        <option value="">Select Project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <label className="text-sm font-medium text-gray-800">
        Reason / Note
      </label>
      <textarea
        placeholder="Reason / Note"
        value={quitNote}
        onChange={(e) => setQuitNote(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-3 text-gray-900"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowQuitBox(false)}
          className="px-3 py-1 border rounded text-gray-800"
        >
          Cancel
        </button>

        <button
          onClick={markAsQuit}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          Confirm Quit
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
