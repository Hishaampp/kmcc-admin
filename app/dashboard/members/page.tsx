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

  const [selectedUnit, setSelectedUnit] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineeContact, setNomineeContact] = useState("");
  const [search, setSearch] = useState("");

  const [showEditBox, setShowEditBox] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);

  const [showDeleteBox, setShowDeleteBox] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState("");

  // FETCH
  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchUnits();
    fetchMembers();
  }, []);

  // ADD
  const addMember = async () => {
    if (!memberName || !memberNumber || !selectedUnit || !contactNumber) return;

    const unit = units.find(u => u.id === selectedUnit);

    await addDoc(collection(db, "members"), {
      name: memberName,
      number: memberNumber,
      unitId: selectedUnit,
      unitName: unit?.name || "",
      status: "active",

      contactNumber,
      nomineeName,
      nomineeRelation,
      nomineeContact,

      createdAt: serverTimestamp(),
    });

    setMemberName("");
    setMemberNumber("");
    setSelectedUnit("");
    setContactNumber("");
    setNomineeName("");
    setNomineeRelation("");
    setNomineeContact("");

    fetchMembers();
  };

  // EDIT
  const saveEdit = async () => {
    if (!editMember) return;

    await updateDoc(doc(db, "members", editMember.id), {
      name: editMember.name,
      number: editMember.number,
      contactNumber: editMember.contactNumber,
      nomineeName: editMember.nomineeName || "",
      nomineeRelation: editMember.nomineeRelation || "",
      nomineeContact: editMember.nomineeContact || "",
    });

    setShowEditBox(false);
    fetchMembers();
  };

  // DELETE
  const deleteMember = async () => {
    await deleteDoc(doc(db, "members", deleteMemberId));
    setShowDeleteBox(false);
    fetchMembers();
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.number?.toLowerCase().includes(search.toLowerCase()) ||
    m.contactNumber?.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-2xl font-bold text-black mb-4">Manage Members</h1>

      {/* ADD MEMBER */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <select
            value={selectedUnit}
            onChange={e => setSelectedUnit(e.target.value)}
            className="border px-3 py-2 text-black"
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
            className="border px-3 py-2 text-black"
          />

          <input
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            placeholder="Member Name"
            className="border px-3 py-2 text-black"
          />

          <input
            value={contactNumber}
            onChange={e => setContactNumber(e.target.value)}
            placeholder="Member Contact Number"
            className="border px-3 py-2 text-black"
          />

          <input
            value={nomineeName}
            onChange={e => setNomineeName(e.target.value)}
            placeholder="Nominee Name (Optional)"
            className="border px-3 py-2 text-black"
          />

          <input
            value={nomineeRelation}
            onChange={e => setNomineeRelation(e.target.value)}
            placeholder="Nominee Relation (Optional)"
            className="border px-3 py-2 text-black"
          />

          <input
            value={nomineeContact}
            onChange={e => setNomineeContact(e.target.value)}
            placeholder="Nominee Contact (Optional)"
            className="border px-3 py-2 text-black"
          />

        </div>

        <button
          onClick={addMember}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Member
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by name, number or phone"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border w-full p-2 mb-4 text-black rounded"
      />

      {/* LIST */}
      <div className="bg-white rounded-xl p-4 border shadow-sm">
        {filteredMembers.map(m => (
          <div key={m.id} className="border p-3 rounded mb-2 flex justify-between text-black">
            <div>
              <p className="font-semibold text-black">{m.name}</p>
              <p className="text-black">#{m.number}</p>
              <p className="text-black">📞 {m.contactNumber || "Not Added"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditMember({ ...m }); setShowEditBox(true); }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => { setDeleteMemberId(m.id); setShowDeleteBox(true); }}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {showEditBox && editMember && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[400px]">

            <h2 className="font-bold mb-3 text-black">Edit Member</h2>

            <label className="text-sm text-black">Member Name</label>
            <input
              value={editMember.name}
              onChange={e => setEditMember({ ...editMember, name: e.target.value })}
              className="border w-full mb-2 p-2 text-black"
            />

            <label className="text-sm text-black">Member Number</label>
            <input
              value={editMember.number}
              onChange={e => setEditMember({ ...editMember, number: e.target.value })}
              className="border w-full mb-2 p-2 text-black"
            />

            <label className="text-sm text-black">Contact Number</label>
            <input
              value={editMember.contactNumber || ""}
              onChange={e => setEditMember({ ...editMember, contactNumber: e.target.value })}
              className="border w-full mb-2 p-2 text-black"
            />

            <label className="text-sm text-black">Nominee Name (Optional)</label>
            <input
              value={editMember.nomineeName || ""}
              onChange={e => setEditMember({ ...editMember, nomineeName: e.target.value })}
              className="border w-full mb-2 p-2 text-black"
            />

            <label className="text-sm text-black">Nominee Relation (Optional)</label>
            <input
              value={editMember.nomineeRelation || ""}
              onChange={e => setEditMember({ ...editMember, nomineeRelation: e.target.value })}
              className="border w-full mb-2 p-2 text-black"
            />

            <label className="text-sm text-black">Nominee Contact (Optional)</label>
            <input
              value={editMember.nomineeContact || ""}
              onChange={e => setEditMember({ ...editMember, nomineeContact: e.target.value })}
              className="border w-full mb-4 p-2 text-black"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEditBox(false)} className="border px-3 py-1">
                Cancel
              </button>
              <button onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1">
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteBox && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[350px] text-center">
            <h2 className="font-bold mb-3 text-black">Delete Member?</h2>
            <p className="mb-4 text-black">This action cannot be undone.</p>

            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteBox(false)} className="border px-3 py-1">
                Cancel
              </button>
              <button onClick={deleteMember} className="bg-red-600 text-white px-3 py-1">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
