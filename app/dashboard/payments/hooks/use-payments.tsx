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
import { logAuditEvent } from "@/lib/auditLog"; // ✅ ADDED
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
    const newPaymentRef = await addDoc(collection(db, "payments"), {
      ...data,
      createdAt: serverTimestamp()
    });

    // 🔔 LOG AUDIT EVENT
    await logAuditEvent({
      action: "payment_added",
      collectionName: "payments",
      documentId: newPaymentRef.id,
      details: {
        memberName: data.memberName,
        memberNumber: data.memberNumber,
        projectName: data.projectName,
        unitName: data.unitName,
        amount: `₹${new Intl.NumberFormat("en-IN").format(Number(data.amount || 0))}`,
        period: `${data.month} ${data.year}`,
      },
    });

    fetchPayments();
  };

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    await updateDoc(doc(db, "payments", id), data);

    // 🔔 LOG AUDIT EVENT
    await logAuditEvent({
      action: "payment_added",
      collectionName: "payments",
      documentId: id,
      details: {
        action: "Updated",
        memberName: data.memberName || "Unknown",
        amount: data.amount ? `₹${new Intl.NumberFormat("en-IN").format(Number(data.amount))}` : "Unknown",
        period: data.month && data.year ? `${data.month} ${data.year}` : "Unknown",
      },
    });

    fetchPayments();
  };

  const deletePaymentById = async (id: string) => {
    const payment = payments.find(p => p.id === id);
    
    await deleteDoc(doc(db, "payments", id));

    // 🔔 LOG AUDIT EVENT
    await logAuditEvent({
      action: "payment_deleted",
      collectionName: "payments",
      documentId: id,
      details: {
        memberName: payment?.memberName,
        memberNumber: payment?.memberNumber,
        projectName: payment?.projectName,
        amount: payment?.amount ? `₹${new Intl.NumberFormat("en-IN").format(Number(payment.amount))}` : "Unknown",
        period: payment?.month && payment?.year ? `${payment.month} ${payment.year}` : "Unknown",
      },
    });

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