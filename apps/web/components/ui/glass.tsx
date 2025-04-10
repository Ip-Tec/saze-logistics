import React from "react";

function GlassComponent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-[90vw] h-[90vh] m-4 mx-auto flex items-center justify-normal overflow-hidden"
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
