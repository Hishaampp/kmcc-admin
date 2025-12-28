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
  const [quitMember, setQuitMember] = useState<any>(null);
  const [projectIdForQuit, setProjectIdForQuit] = useState("");
  const [quitNote, setQuitNote] = useState("");

  // Edit
  const [showEditBox, setShowEditBox] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);

  // Delete
  const [showDeleteBox, setShowDeleteBox] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState("");

  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchUnits();
    fetchMembers();
    fetchProjects();
  }, []);

  // ADD MEMBER
  const addMember = async () => {
    if (!memberName.trim() || !memberNumber.trim() || !selectedUnit) return;

    const unit = units.find(u => u.id === selectedUnit);

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

  // QUIT MEMBER
  const markAsQuit = async () => {
    if (!quitMember || !projectIdForQuit) return;

    const project = projects.find(p => p.id === projectIdForQuit);

    await updateDoc(doc(db, "members", quitMember.id), {
      status: "quit",
      quitProjectId: projectIdForQuit,
      quitProjectName: project?.name || "",
      quitUnitId: quitMember.unitId,
      quitUnitName: quitMember.unitName,
      quitDate: serverTimestamp(),
      quitNote,
    });

    setShowQuitBox(false);
    setQuitMember(null);
    setQuitNote("");
    setProjectIdForQuit("");
    fetchMembers();
  };

  // EDIT
  const saveEdit = async () => {
    if (!editMember) return;
    if (!editMember.name.trim() || !editMember.number.trim() || !editMember.unitId)
      return;

    const unit = units.find(u => u.id === editMember.unitId);

    await updateDoc(doc(db, "members", editMember.id), {
      name: editMember.name,
      number: editMember.number,
      unitId: editMember.unitId,
      unitName: unit?.name || "",
    });

    setShowEditBox(false);
    fetchMembers();
  };

  // DELETE
  const deleteMember = async () => {
    if (!deleteMemberId) return;

    await deleteDoc(doc(db, "members", deleteMemberId));
    setShowDeleteBox(false);
    fetchMembers();
  };

  // FILTER
  const filteredMembers = members.filter(m => {
    const matchUnit = selectedUnit === "" ? true : m.unitId === selectedUnit;
    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.number?.toLowerCase().includes(search.toLowerCase());
    return matchUnit && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Manage Members
      </h1>

      {/* ADD MEMBER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Add New Member</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedUnit}
            onChange={e => setSelectedUnit(e.target.value)}
            className="border rounded px-3 py-2 text-black"
          >
            <option value="">Select Unit</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <input
            value={memberNumber}
            onChange={e => setMemberNumber(e.target.value)}
            placeholder="Member Number"
            className="border rounded px-3 py-2 text-black"
          />

          <input
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            placeholder="Member Name"
            className="border rounded px-3 py-2 text-black"
          />
        </div>

        <button
          onClick={addMember}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Member
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <input
          placeholder="Search by name or number"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-black w-full"
        />

        <select
          value={selectedUnit}
          onChange={e => setSelectedUnit(e.target.value)}
          className="border rounded px-3 py-2 text-black w-full md:w-60"
        >
          <option value="">All Units</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Members List</h2>

        {filteredMembers.length === 0 && (
          <p className="text-gray-600">No members found.</p>
        )}

        <ul className="space-y-2">
          {filteredMembers.map(m => (
            <li key={m.id} className="p-3 border rounded bg-gray-50 flex justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {m.name}
                  {m.status === "quit" && (
                    <span className="ml-2 text-sm text-red-600">(Quit)</span>
                  )}
                </p>
                <p className="text-sm text-gray-700">#{m.number}</p>
                <p className="text-xs text-gray-600">{m.unitName}</p>
              </div>

              <div className="flex gap-2">

                {m.status === "active" && (
                  <button
                    onClick={() => {
                      setQuitMember(m);
                      setShowQuitBox(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Quit
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditMember({ ...m });
                    setShowEditBox(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    setDeleteMemberId(m.id);
                    setShowDeleteBox(true);
                  }}
                  className="px-3 py-1 bg-black text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>


      {/* ========================== QUIT MODAL ========================== */}
      {showQuitBox && quitMember && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[380px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Mark as Quit — {quitMember.name}
            </h2>

            <select
              value={projectIdForQuit}
              onChange={e => setProjectIdForQuit(e.target.value)}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <textarea
              placeholder="Quit Note (optional)"
              value={quitNote}
              onChange={e => setQuitNote(e.target.value)}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowQuitBox(false)} className="px-3 py-1 border rounded">
                Cancel
              </button>

              <button onClick={markAsQuit} className="px-3 py-1 bg-red-600 text-white rounded">
                Mark Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================== EDIT MODAL ========================== */}
      {showEditBox && editMember && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[380px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Edit Member
            </h2>

            <input
              value={editMember.name}
              onChange={e => setEditMember({ ...editMember, name: e.target.value })}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            />

            <input
              value={editMember.number}
              onChange={e => setEditMember({ ...editMember, number: e.target.value })}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            />

            <select
              value={editMember.unitId}
              onChange={e => setEditMember({ ...editMember, unitId: e.target.value })}
              className="border rounded px-3 py-2 w-full text-black mb-3"
            >
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEditBox(false)} className="px-3 py-1 border rounded">
                Cancel
              </button>

              <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================== DELETE MODAL ========================== */}
      {showDeleteBox && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[360px] text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Member?
            </h2>

            <p className="text-gray-700 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteBox(false)} className="px-3 py-1 border rounded">
                Cancel
              </button>

              <button onClick={deleteMember} className="px-3 py-1 bg-black text-white rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
