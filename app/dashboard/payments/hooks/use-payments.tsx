"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { Member, Project, Unit, Payment } from "../types";

export default function usePayments() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
  };

  const fetchUnits = async () => {
    const snap = await getDocs(collection(db, "units"));
    setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
  };

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
  };

  const fetchPayments = async () => {
    const snap = await getDocs(collection(db, "payments"));
    setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
  };

  useEffect(() => {
    Promise.all([
      fetchProjects(),
      fetchUnits(),
      fetchMembers(),
      fetchPayments()
    ]).then(() => setLoading(false));
  }, []);

  const addPayment = async (data: Omit<Payment, "id">) => {
    await addDoc(collection(db, "payments"), {
      ...data,
      createdAt: serverTimestamp()
    });
    fetchPayments();
  };

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    await updateDoc(doc(db, "payments", id), data);
    fetchPayments();
  };

  const deletePaymentById = async (id: string) => {
    await deleteDoc(doc(db, "payments", id));
    fetchPayments();
  };

  return {
    loading,
    projects,
    units,
    members,
    payments,
    addPayment,
    updatePayment,
    deletePaymentById
  };
}
