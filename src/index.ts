import Expo from "expo-server-sdk";
import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();

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

export const notifyOnAppointmentCreate = onDocumentCreated("appointments/{id}", async (event) => {
  const data = event.data?.data() as any || null;
  if (!data) return;
  const expo = new Expo();
  const adminTokens = await getAdminTokens();
  if (adminTokens.length === 0) return;

  const messages = adminTokens.map((to) => ({
    to,
    sound: "default",
    title: "Nueva cita pendiente",
    body: `${data.serviceName} • ${new Date(data.startAt).toLocaleString("es-MX")}`,
    data: { type: "appointment_pending", appointmentId: event.params.id },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
});

export const notifyOnAppointmentUpdate = onDocumentUpdated("appointments/{id}", async (event) => {
  const before = event.data?.before?.data() as any;
  const after = event.data?.after?.data() as any;
  if (!before || !after || before.status === after.status) return; // solo si cambia el estado

  const expo = new Expo();
  const toUser = await getUserToken(after.userId);
  if (!toUser) return;

  let title = "";
  let body = "";
  let type = "";
  if (after.status === "confirmed") {
    title = "Cita confirmada";
    body = `${after.serviceName} confirmado para ${new Date(after.startAt).toLocaleString("es-MX")}`;
    type = "appointment_confirmed";
  } else if (after.status === "cancelled") {
    title = "Cita cancelada";
    body = `${after.serviceName} cancelado.`;
    type = "appointment_cancelled";
  } else {
    return;
  }

  const messages = [{ to: toUser, sound: "default", title, body, data: { type, appointmentId: event.params.id } }];
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
});