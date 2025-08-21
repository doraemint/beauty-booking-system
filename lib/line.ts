import crypto from "crypto";

export function verifyLineSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const h = crypto.createHmac("sha256", process.env.LINE_CHANNEL_SECRET!).update(rawBody).digest("base64");
  return h === signature;
}

export async function lineReply(replyToken: string, messages: any[]) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN!}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

export async function linePush(to: string, messages: any[]) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN!}`,
    },
    body: JSON.stringify({ to, messages }),
  });
}
