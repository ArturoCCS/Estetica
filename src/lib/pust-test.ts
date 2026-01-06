export async function sendTestPush(to: string) {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify([{ to, title: "Prueba", body: "Notificación de prueba" }]),
  });
  const data = await res.json();
  console.log("push result", data);
  return data;
}