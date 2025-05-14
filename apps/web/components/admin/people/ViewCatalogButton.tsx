import ActionButton from "@/components/admin/people/ActionButton";

export default function ViewCatalogButton({ vendorId }: { vendorId: string }) {
  return (
    <ActionButton
      label="View Catalog"
      onClick={() => {
        window.location.href = `/admin/vendors/${vendorId}/catalog`;
      }}
    />
  );
}
