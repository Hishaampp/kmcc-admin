import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type AuditAction = 
  | "member_added" 
  | "member_edited" 
  | "member_deleted" 
  | "member_quit"
  | "member_rejoined"
  | "payment_added" 
  | "payment_edited"
  | "payment_deleted"
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "project_added"
  | "project_edited"
  | "project_deleted"
  | "unit_added"
  | "unit_edited"
  | "unit_deleted"
  | "other_income_added"
  | "other_income_edited"  // ✅ ADDED
  | "other_income_deleted"
  | "profit_added"
  | "profit_edited"      
  | "profit_deleted"
  | "asset_added"
  | "asset_edited" 
  | "asset_deleted"
  | "investment_added"
  | "investment_edited"  
  | "investment_deleted"
  | "document_uploaded"
  | "document_deleted";

interface AuditLogData {
  action: AuditAction;
  collectionName: string;
  documentId?: string;
  details: Record<string, any>;
}

export const logAuditEvent = async (data: AuditLogData) => {
  try {
    // Get current logged-in user from Firebase Auth
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn("⚠️ No user logged in, audit log not created");
      return;
    }

    // Create audit log with user info
    await addDoc(collection(db, "auditLogs"), {
      ...data,
      performedBy: currentUser.email, // ✅ Real email from Firebase Auth
      performedByUid: currentUser.uid,
      timestamp: serverTimestamp(),
    });
    
    console.log("✅ Audit log created:", data.action, "by", currentUser.email);
  } catch (error) {
    console.error("❌ Failed to create audit log:", error);
  }
};