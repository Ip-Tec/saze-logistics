// components\admin\people\ToggleSuspensionButton.tsx

import { supabaseFE } from "@shared/supabaseClient";
import ActionButton from "@/components/admin/people/ActionButton";
import { toast } from "react-toastify";

export default function ToggleSuspensionButton({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";

  const handleClick = async () => {
    const { error } = await supabaseFE
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) return toast.error("Error: " + error.message);
    toast.info(`User marked as ${nextStatus}`);
  };

  return (
    <ActionButton
      label={currentStatus === "suspended" ? "Activate" : "Suspend"}
      onClick={handleClick}
      colorClass={
        currentStatus === "suspended"
          ? "bg-green-500 text-white"
          : "bg-red-600 text-white"
      }
    />
  );
}
