import Expo from "expo-server-sdk";
import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

admin.initializeApp();
const db = admin.firestore();

// ==================== HELPERS ====================

async function getAdminTokens(): Promise<string[]> {
  const snap = await db.collection("users").get();
  const tokens: string[] = [];
  snap.forEach(doc => {
    const d = doc.data() as any;
    const isAdmin = d.role === "admin" || (process.env.ADMIN_EMAILS && String(process.env.ADMIN_EMAILS).toLowerCase().split(",").map(s => s.trim()).includes((d.email || "").toLowerCase()));
    if (isAdmin && typeof d.expoPushToken === "string" && d.expoPushToken.startsWith("ExponentPushToken")) {
      tokens.push(d.expoPushToken);
    }
  });
  return tokens;
}

async function getUserToken(uid: string): Promise<string | null> {
  const docRef = await db.collection("users").doc(uid).get();
  const d = docRef.data() as any;
  const token = d?.expoPushToken;
  return typeof token === "string" && token.startsWith("ExponentPushToken") ? token : null;
}

async function sendPushNotification(tokens: string[], title: string, body: string, data?: any) {
  if (tokens.length === 0) return;
  const expo = new Expo();
  const messages = tokens.map((to) => ({
    to,
    sound: "default" as const,
    title,
    body,
    data: data || {},
  }));
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Error sending push notifications:", error);
    }
  }
}

// ==================== NOTIFICATIONS ====================

export const notifyOnAppointmentCreate = onDocumentCreated("appointments/{id}", async (event) => {
  const data = event.data?.data() as any || null;
  if (!data) return;
  
  // Notify admin of new appointment request
  const adminTokens = await getAdminTokens();
  if (adminTokens.length === 0) return;

  await sendPushNotification(
    adminTokens,
    "Nueva cita pendiente",
    `${data.serviceName} • ${new Date(data.requestedStartAt).toLocaleString("es-MX")}`,
    { type: "appointment_pending", appointmentId: event.params.id }
  );
});

export const notifyOnAppointmentUpdate = onDocumentUpdated("appointments/{id}", async (event) => {
  const before = event.data?.before?.data() as any;
  const after = event.data?.after?.data() as any;
  if (!before || !after || before.status === after.status) return; // only on status change

  const expo = new Expo();
  const toUser = await getUserToken(after.userId);
  if (!toUser) return;

  let title = "";
  let body = "";
  let type = "";
  
  if (after.status === "awaiting_payment") {
    title = "Cita aprobada - Pago requerido";
    body = `${after.serviceName} aprobado. Paga $${after.depositAmount} MXN antes de ${new Date(after.paymentDueAt).toLocaleString("es-MX")}`;
    type = "appointment_awaiting_payment";
  } else if (after.status === "confirmed") {
    title = "Cita confirmada";
    const dateStr = after.finalStartAt ? new Date(after.finalStartAt).toLocaleString("es-MX") : new Date(after.requestedStartAt).toLocaleString("es-MX");
    body = `${after.serviceName} confirmado para ${dateStr}`;
    type = "appointment_confirmed";
  } else if (after.status === "cancelled") {
    title = "Cita cancelada";
    body = `${after.serviceName} ha sido cancelado.`;
    type = "appointment_cancelled";
  } else if (after.status === "expired") {
    title = "Cita expirada";
    body = `${after.serviceName} expiró por falta de pago.`;
    type = "appointment_expired";
  } else {
    return;
  }

  await sendPushNotification([toUser], title, body, { type, appointmentId: event.params.id });
});

// ==================== MERCADO PAGO ====================

function getMPClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN environment variable not configured. Please set it in functions/.env file.");
  }
  return new MercadoPagoConfig({ accessToken });
}

export const createPaymentPreference = onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      res.status(400).json({ error: "appointmentId required" });
      return;
    }

    const appointmentRef = db.collection("appointments").doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();
    
    if (!appointmentSnap.exists) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const appointment = appointmentSnap.data() as any;

    if (appointment.status !== "awaiting_payment") {
      res.status(400).json({ error: "Appointment is not awaiting payment" });
      return;
    }

    if (!appointment.depositAmount || appointment.depositAmount <= 0) {
      res.status(400).json({ error: "Invalid deposit amount" });
      return;
    }

    const client = getMPClient();
    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          title: `Depósito: ${appointment.serviceName}`,
          quantity: 1,
          unit_price: appointment.depositAmount,
          currency_id: "MXN",
        },
      ],
      external_reference: appointmentId,
      notification_url: process.env.MP_WEBHOOK_URL || "",
      back_urls: {
        success: process.env.MP_SUCCESS_URL || "",
        failure: process.env.MP_FAILURE_URL || "",
        pending: process.env.MP_PENDING_URL || "",
      },
      auto_return: "approved" as const,
    };

    const result = await preference.create({ body: preferenceData });

    // Save preference ID to appointment
    await appointmentRef.update({
      mpPreferenceId: result.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("Error creating MP preference:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export const mercadoPagoWebhook = onRequest(async (req, res) => {
  try {
    // NOTE: In production, validate webhook signature using x-signature header
    // See: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#bookmark_validate_origin
    // For now, we validate by fetching payment data directly from MP API
    
    const { type, data } = req.body;

    console.log("MP Webhook received:", { type, data });

    // Only process payment notifications
    if (type !== "payment") {
      res.status(200).send("OK");
      return;
    }

    const paymentId = data?.id;
    if (!paymentId) {
      res.status(400).send("No payment ID");
      return;
    }

    const client = getMPClient();
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    console.log("Payment data:", paymentData);

    const appointmentId = paymentData.external_reference;
    if (!appointmentId) {
      console.error("No external_reference in payment");
      res.status(200).send("OK");
      return;
    }

    const appointmentRef = db.collection("appointments").doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      console.error("Appointment not found:", appointmentId);
      res.status(200).send("OK");
      return;
    }

    const updateData: any = {
      mpPaymentId: paymentId.toString(),
      mpStatus: paymentData.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // If payment approved, confirm appointment
    if (paymentData.status === "approved") {
      updateData.status = "confirmed";
    }

    await appointmentRef.update(updateData);

    res.status(200).send("OK");
  } catch (error: any) {
    console.error("Error processing MP webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCHEDULED TASKS ====================

export const expireUnpaidAppointments = onSchedule("every 1 hour", async () => {
  const now = admin.firestore.Timestamp.now();
  
  // Find appointments that are awaiting_payment and past paymentDueAt
  const q = db.collection("appointments")
    .where("status", "==", "awaiting_payment")
    .where("paymentDueAt", "<=", now.toDate().toISOString());

  const snap = await q.get();

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: "expired",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  if (snap.size > 0) {
    await batch.commit();
    console.log(`Expired ${snap.size} appointments`);
  }
});