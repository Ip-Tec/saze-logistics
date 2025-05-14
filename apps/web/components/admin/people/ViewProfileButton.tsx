// components\admin\people\VerifyRejectRider.tsx

import ActionButton from "@/components/admin/people/ActionButton";

export default function ViewProfileButton({ riderId }: { riderId: string }) {
  return (
    <ActionButton
      label="View Profile"
      onClick={() => {
        window.location.href = `/admin/riders/${riderId}`;
      }}
    />
  );
}
