"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function MembersPage() {
  const router = useRouter();

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

  // Edit States
  const [showEditBox, setShowEditBox] = useState(false);
  const [editMemberId, setEditMemberId] = useState("");
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editUnit, setEditUnit] = useState("");

  // Delete State
  const [showDeleteBox, setShowDeleteBox] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState("");

  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

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
    if (!quitMemberId || !projectIdForQuit) return;

    const member = members.find((m) => m.id === quitMemberId);
    const project = projects.find((p) => p.id === projectIdForQuit);
    if (!member) return;

    await updateDoc(doc(db, "members", quitMemberId), {
      status: "quit",
      quitProjectId: projectIdForQuit,
      quitProjectName: project?.name || "",
      quitUnitId: member.unitId,
      quitUnitName: member.unitName,
      quitDate: serverTimestamp(),
      quitNote,
    });

    setShowQuitBox(false);
    setQuitNote("");
    setQuitMemberId("");
    setProjectIdForQuit("");
    fetchMembers();
  };

  // Edit Member
  const openEdit = (m: any) => {
    setEditMemberId(m.id);
    setEditName(m.name);
    setEditNumber(m.number);
    setEditUnit(m.unitId);
    setShowEditBox(true);
  };

  const saveEdit = async () => {
    if (!editMemberId || !editName.trim() || !editNumber.trim() || !editUnit)
      return;

    const unit = units.find((u) => u.id === editUnit);

    await updateDoc(doc(db, "members", editMemberId), {
      name: editName,
      number: editNumber,
      unitId: editUnit,
      unitName: unit?.name || "",
    });

    setShowEditBox(false);
    fetchMembers();
  };

  // Delete Member
  const deleteMember = async () => {
    if (!deleteMemberId) return;

    await deleteDoc(doc(db, "members", deleteMemberId));
    setShowDeleteBox(false);
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

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded-lg hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">Manage Members</h1>

      {/* ADD MEMBER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Add New Member</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="border rounded px-3 py-2 w-full text-black placeholder-gray-800"
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
            className="border rounded px-3 py-2 w-full text-black placeholder-gray-800"
          />

          <input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="Member Name"
            className="border rounded px-3 py-2 w-full text-black placeholder-gray-800"
          />
        </div>

        <button
          onClick={addMember}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Member
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-3">

        <input
          placeholder="Search by name or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full text-black placeholder-gray-800"
        />

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-60 text-black placeholder-gray-800"
        >
          <option value="">All Units</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Members List</h2>

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

              <div className="flex gap-2">

                {m.status === "active" && (
                  <button
                    onClick={() => {
                      setQuitMemberId(m.id);
                      setShowQuitBox(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
                  >
                    Quit
                  </button>
                )}

                <button
                  onClick={() => openEdit(m)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    setDeleteMemberId(m.id);
                    setShowDeleteBox(true);
                  }}
                  className="px-3 py-1 bg-black text-white rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* POPUPS REMAIN SAME (Quit, Edit, Delete) — YOUR existing popups continue */}
    </div>
  );
}
