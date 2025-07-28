// utils/sendNotification.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendNotification({
  receiver_id,
  title,
  body,
  type,
  metadata = {},
}: {
  receiver_id: string;
  title: string;
  body: string;
  type: "info" | "error" | "success" | "chat";
  metadata?: object;
}) {
  const { error } = await supabase.from("notifications").insert({
    receiver_id,
    title,
    body,
    type,
    metadata,
    read: false,
  });

  if (error) console.error("Notification Error:", error);
}
