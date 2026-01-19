"use client";

import { useEffect, useState } from "react";
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

  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

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

  const [showQuitBox, setShowQuitBox] = useState(false);
  const [quitMember, setQuitMember] = useState<any>(null);
  const [quitProjectId, setQuitProjectId] = useState("");
  const [quitNote, setQuitNote] = useState("");

  // FETCH
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

      quitProjects: [], // Initialize empty quit projects array

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

  // UPDATED: QUIT MEMBER FUNCTION
  const quitMemberFromProject = async () => {
    if (!quitMember || !quitProjectId) {
      alert("Please select a project");
      return;
    }

    const project = projects.find(p => p.id === quitProjectId);

    // Get existing quit projects or initialize empty array
    const currentQuitProjects = quitMember.quitProjects || [];
    
    // Check if already quit from this project
    if (currentQuitProjects.includes(quitProjectId)) {
      alert("Member has already quit from this project");
      return;
    }

    // Add this project to quit list
    const updatedQuitProjects = [...currentQuitProjects, quitProjectId];

    // Prepare quit history entry
    const quitHistory = quitMember.quitHistory || {};
    quitHistory[quitProjectId] = {
      projectName: project?.name || "Unknown Project",
      note: quitNote.trim() || "",
      quitDate: serverTimestamp()
    };

    await updateDoc(doc(db, "members", quitMember.id), {
      quitProjects: updatedQuitProjects,
      quitHistory: quitHistory,
      
      // Keep status as active if they're still in other projects
      status: "active"
    });

    setShowQuitBox(false);
    setQuitMember(null);
    setQuitProjectId("");
    setQuitNote("");
    fetchMembers();

    alert(`✅ ${quitMember.name} has quit from ${project?.name}`);
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.number?.toLowerCase().includes(search.toLowerCase()) ||
    m.contactNumber?.includes(search) ||
    m.nomineeName?.toLowerCase().includes(search.toLowerCase())
  );

  // UPDATED: Show members who haven't quit from ALL projects
  const activeMembers = filteredMembers.filter(m => {
    // Show if quitProjects doesn't exist or is empty (backward compatibility)
    return !m.quitProjects || m.quitProjects.length === 0 || m.status === "active";
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-2xl font-bold text-black mb-4">Manage Members</h1>

      {/* ADD */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <h2 className="font-semibold mb-3 text-black">Add New Member</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="border px-3 py-2 text-black rounded">
            <option value="">Select Unit</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <input value={memberNumber} onChange={e => setMemberNumber(e.target.value)} placeholder="Member Number" className="border px-3 py-2 text-black rounded"/>
          <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Member Name" className="border px-3 py-2 text-black rounded"/>
          <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="Member Contact" className="border px-3 py-2 text-black rounded"/>
          <input value={nomineeName} onChange={e => setNomineeName(e.target.value)} placeholder="Nominee Name (Optional)" className="border px-3 py-2 text-black rounded"/>
          <input value={nomineeRelation} onChange={e => setNomineeRelation(e.target.value)} placeholder="Nominee Relation (Optional)" className="border px-3 py-2 text-black rounded"/>
          <input value={nomineeContact} onChange={e => setNomineeContact(e.target.value)} placeholder="Nominee Contact (Optional)" className="border px-3 py-2 text-black rounded"/>

        </div>

        <button onClick={addMember} className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
          Add Member
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="🔍 Search by name, phone, nominee"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border w-full p-3 mb-4 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* LIST */}
      <div className="bg-white rounded-xl p-4 border shadow-sm">
        <h2 className="font-semibold mb-4 text-black text-lg">
          Active Members ({activeMembers.length})
        </h2>

        {activeMembers.length === 0 && (
          <p className="text-gray-500 text-center py-4">No active members found</p>
        )}

        {activeMembers.map(m => {
          const quitProjects = m.quitProjects || [];
          const hasQuitSomeProjects = quitProjects.length > 0;
          
          return (
            <div key={m.id} className="border p-4 rounded-lg mb-3 text-black hover:shadow-md transition">

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{m.name}</p>
                    {hasQuitSomeProjects && (
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
                        Quit from {quitProjects.length} project{quitProjects.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Member No: #{m.number}</p>
                  <p className="text-sm text-gray-600">Unit: {m.unitName}</p>
                  <p className="text-sm">📞 {m.contactNumber || "Not Added"}</p>
                  
                  {/* Show quit project names */}
                  {hasQuitSomeProjects && (
                    <div className="mt-2 text-xs text-orange-600">
                      <p className="font-semibold">Quit from:</p>
                      {quitProjects.map((pId: string) => {
                        const quitInfo = m.quitHistory?.[pId];
                        return (
                          <p key={pId}>• {quitInfo?.projectName || pId}</p>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <button 
                    onClick={() => { 
                      setEditMember({ ...m }); 
                      setShowEditBox(true); 
                    }} 
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-sm"
                  >
                    Edit
                  </button>
                  
                  <button 
                    onClick={() => { 
                      setQuitMember(m); 
                      setShowQuitBox(true); 
                    }} 
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition text-sm"
                  >
                    Quit Project
                  </button>
                  
                  <button 
                    onClick={() => { 
                      setDeleteMemberId(m.id); 
                      setShowDeleteBox(true); 
                    }} 
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-xs text-gray-600">Nominee Name</p>
                  <p className="font-semibold text-black">{m.nomineeName || "Not Added"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Relation</p>
                  <p className="font-semibold text-black">{m.nomineeRelation || "Not Added"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Nominee Contact</p>
                  <p className="font-semibold text-black">{m.nomineeContact || "Not Added"}</p>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {showEditBox && editMember && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-[450px] text-black max-h-[90vh] overflow-y-auto">

            <h2 className="font-bold mb-4 text-xl">Edit Member</h2>

            <label className="text-sm font-medium block mb-1">Member Name</label>
            <input 
              value={editMember.name} 
              onChange={e => setEditMember({ ...editMember, name: e.target.value })} 
              className="border w-full mb-3 p-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="text-sm font-medium block mb-1">Member Number</label>
            <input 
              value={editMember.number} 
              onChange={e => setEditMember({ ...editMember, number: e.target.value })} 
              className="border w-full mb-3 p-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="text-sm font-medium block mb-1">Contact Number</label>
            <input 
              value={editMember.contactNumber || ""} 
              onChange={e => setEditMember({ ...editMember, contactNumber: e.target.value })} 
              className="border w-full mb-3 p-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="text-sm font-medium block mb-1">Nominee Name</label>
            <input 
              value={editMember.nomineeName || ""} 
              onChange={e => setEditMember({ ...editMember, nomineeName: e.target.value })} 
              className="border w-full mb-3 p-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="text-sm font-medium block mb-1">Nominee Relation</label>
            <input 
              value={editMember.nomineeRelation || ""} 
              onChange={e => setEditMember({ ...editMember, nomineeRelation: e.target.value })} 
              className="border w-full mb-3 p-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="text-sm font-medium block mb-1">Nominee Contact</label>
            <input 
              value={editMember.nomineeContact || ""} 
              onChange={e => setEditMember({ ...editMember, nomineeContact: e.target.value })} 
              className="border w-full mb-4 p-2 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowEditBox(false)} 
                className="border px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUIT MEMBER MODAL */}
      {showQuitBox && quitMember && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-[450px] text-black">

            <h2 className="font-bold mb-4 text-xl text-orange-600">
              Quit Member from Project
            </h2>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-black">{quitMember.name}</p>
              <p className="text-sm text-gray-600">Member #{quitMember.number}</p>
              <p className="text-sm text-gray-600">Unit: {quitMember.unitName}</p>
              
              {quitMember.quitProjects && quitMember.quitProjects.length > 0 && (
                <div className="mt-2 pt-2 border-t border-orange-300">
                  <p className="text-xs text-orange-700 font-semibold">Already quit from:</p>
                  {quitMember.quitProjects.map((pId: string) => {
                    const quitInfo = quitMember.quitHistory?.[pId];
                    return (
                      <p key={pId} className="text-xs text-orange-600">
                        • {quitInfo?.projectName || pId}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="text-sm font-medium block mb-2">
              Select Project to Quit From *
            </label>
            <select
              value={quitProjectId}
              onChange={e => setQuitProjectId(e.target.value)}
              className="border w-full p-3 mb-4 text-black rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Select Project --</option>
              {projects
                .filter(p => !quitMember.quitProjects?.includes(p.id))
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>

            <label className="text-sm font-medium block mb-2">
              Quit Reason / Notes (Optional)
            </label>
            <textarea
              value={quitNote}
              onChange={e => setQuitNote(e.target.value)}
              placeholder="Enter reason for quitting (optional)"
              className="border w-full p-3 mb-4 text-black rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> This member will be marked as quit from the selected project only. They will remain active for other projects.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowQuitBox(false);
                  setQuitMember(null);
                  setQuitProjectId("");
                  setQuitNote("");
                }} 
                className="border px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={quitMemberFromProject} 
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
              >
                Confirm Quit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteBox && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-[400px] text-center text-black">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="font-bold mb-2 text-xl">Delete Member?</h2>
              <p className="text-gray-600">
                This action cannot be undone. All member data will be permanently removed.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setShowDeleteBox(false)} 
                className="border px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={deleteMember} 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}