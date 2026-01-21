import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// =====================================================
// EMAIL CONFIGURATION
// =====================================================

// Configure email transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hishampp.pro@gmail.com", // ✅ Your Gmail
    pass: "ccjg frzm phki wysf", // ✅ Replace with App Password
  },
});

// Email recipient (your dad's email)
const ADMIN_EMAIL = "nizarpp@gmail.com";

// =====================================================
// ACTION LABELS (User-friendly names)
// =====================================================

const actionLabels: Record<string, string> = {
  member_added: "New Member Added",
  member_edited: "Member Updated",
  member_deleted: "Member Deleted",
  member_quit: "Member Quit from Project",
  member_rejoined: "Member Rejoined Project",
  payment_added: "Payment Added",
  payment_deleted: "Payment Deleted",
  expense_added: "Expense Added",
  expense_deleted: "Expense Deleted",
  project_added: "Project Added",
  project_edited: "Project Updated",
  project_deleted: "Project Deleted",
  unit_added: "Unit Added",
  unit_edited: "Unit Updated",
  unit_deleted: "Unit Deleted",
  other_income_added: "Other Income Added",
  other_income_deleted: "Other Income Deleted",
  profit_added: "Profit Added",
  profit_deleted: "Profit Deleted",
  asset_added: "Asset Added",
  asset_deleted: "Asset Deleted",
  investment_added: "Investment Added",
  investment_deleted: "Investment Deleted",
  document_uploaded: "Document Uploaded",
  document_deleted: "Document Deleted",
};

// =====================================================
// CLOUD FUNCTION: Send Audit Notification
// Triggers when new document is created in auditLogs
// =====================================================

export const sendAuditNotification = onDocumentCreated(
  "auditLogs/{logId}",
  async (event) => {
    const data = event.data?.data();

    if (!data) {
      logger.error("No data found in audit log");
      return;
    }

    logger.info("Processing audit log:", data.action);

    // Get user-friendly action name
    const actionLabel = actionLabels[data.action] || "Dashboard Activity";

    // Format timestamp
    const timestamp = data.timestamp
      ? new Date(data.timestamp.toDate()).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "long",
      })
      : "Unknown time";

    // Create email subject
    const subject = `🔔 KMCC Dashboard Alert: ${actionLabel}`;

    // Format details for display
    const detailsHtml = Object.entries(data.details)
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
        return `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${formattedKey}:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${value}</td>
        </tr>`;
      })
      .join("");

    // Create email body with professional styling
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">🔔 KMCC Dashboard Alert</h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px;">
            
            <!-- Action Badge -->
            <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <h2 style="margin: 0 0 5px 0; color: #1e40af; font-size: 20px;">${actionLabel}</h2>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px;">A change was made to your dashboard</p>
            </div>

            <!-- Details Table -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Change Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Performed By:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.performedBy}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Time:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${timestamp}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Collection:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.collectionName}</td>
                </tr>
                ${detailsHtml}
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kmcc-admin.vercel.app/dashboard" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">View Dashboard</a>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated notification from KMCC Dashboard System.
                <br>If you have concerns about this activity, please check the dashboard immediately.
              </p>
            </div>

          </div>

          <!-- Footer Bar -->
          <div style="background: #f3f4f6; padding: 15px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
              © ${new Date().getFullYear()} KMCC Dashboard. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    // Send email
    try {
      await transporter.sendMail({
        from: '"KMCC Dashboard System" <hishampp.pro@gmail.com>',
        to: ADMIN_EMAIL,
        subject: subject,
        html: emailBody,
      });

      logger.info("✅ Email sent successfully for:", data.action);
    } catch (error) {
      logger.error("❌ Failed to send email:", error);
      throw error;
    }
  }
);

// =====================================================
// HEALTH CHECK FUNCTION (Optional - for testing)
// =====================================================

import {onRequest} from "firebase-functions/https";

export const healthCheck = onRequest((request, response) => {
  response.json({
    status: "ok",
    message: "KMCC Cloud Functions are running!",
    timestamp: new Date().toISOString(),
  });
});