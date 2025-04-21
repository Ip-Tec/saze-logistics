import React from "react";

function GlassComponent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`md:w-[95vw] md:h-[95vh] md:m-4 mx-auto flex items-center justify-normal overflow-hidden ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.2)", // Light transparent white background
        backdropFilter: "blur(10px)", // Blur the background to create the glass effect
        borderRadius: "10px", // Optional: Add rounded corners to the glass effect
      }}
    >
      {children}
    </div>
  );
}

export default GlassComponent;
