// components/ui/Spinner.tsx

export function Spinner({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "h-4 w-4" :
               size === "lg" ? "h-10 w-10" : "h-6 w-6";

  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-orange-600 ${dims}`}
      role="status"
      aria-label="loading"
    />
  );
}
