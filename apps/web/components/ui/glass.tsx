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
      className={`w-full h-full w-full h-auto mx-auto flex items-center justify-center ${className}`}
      style={{
        borderRadius: "10px",
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.2)",
      }}
    >
      {children}
    </div>
  );
}

export default GlassComponent;
