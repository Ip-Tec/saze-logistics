// components\admin\people\ApproveRejectVendor.tsx

import { supabaseFE } from "@shared/supabaseClient";
import ActionButton from "@/components/admin/people/ActionButton";
import { toast, ToastContainer } from "react-toastify";

export default function ApproveRejectVendor({ id }: { id: string }) {
  const approve = async () => {
    const { error } = await supabaseFE
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) return toast.error("Error: " + error.message);
    toast.info("Vendor approved");
  };

  const reject = async () => {
    const { error } = await supabaseFE
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return toast.error("Error: " + error.message);
    toast.info("Vendor rejected");
  };

  return (
    <div className="space-x-2">
      <ToastContainer />
      <ActionButton
        label="Approve"
        onClick={approve}
        colorClass="bg-green-600 text-white"
      />
      <ActionButton
        label="Reject"
        onClick={reject}
        colorClass="bg-red-600 text-white"
      />
    </div>
  );
}
