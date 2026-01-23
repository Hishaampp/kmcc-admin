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

export default function useExpenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    const snap = await getDocs(collection(db, "expenses"));
    setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
  };

  useEffect(() => {
    fetchExpenses().then(() => setLoading(false));
  }, []);

  const addExpense = async (data: any) => {
    const docRef = await addDoc(collection(db, "expenses"), {
      ...data,
      createdAt: serverTimestamp(),
      type: "expense"
    });
    fetchExpenses();
    return docRef; // ✅ ADD THIS LINE
  };

  const updateExpense = async (id: string, data: Partial<any>) => {
    await updateDoc(doc(db, "expenses", id), data);
    fetchExpenses();
  };

  const deleteExpenseById = async (id: string) => {
    await deleteDoc(doc(db, "expenses", id));
    fetchExpenses();
  };

  return {
    loading,
    expenses,
    addExpense,
    updateExpense,
    deleteExpenseById
  };
}