// components\admin\people\VerifyRejectRider.tsx

import { supabaseFE } from "@shared/supabaseClient";
import ActionButton from "@/components/admin/people/ActionButton";
import { toast, ToastContainer } from "react-toastify";

export default function VerifyRejectRider({ id }: { id: string }) {
  const verify = async () => {
    const { error } = await supabaseFE
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) return toast.error("Error: " + error.message);
    toast.info("Rider verified");
  };

  const reject = async () => {
    const { error } = await supabaseFE
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return toast.error("Error: " + error.message);
    toast.info("Rider rejected");
  };

  return (
    <div className="space-x-2">
      <ToastContainer />
      <ActionButton
        label="Verify"
        onClick={verify}
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
