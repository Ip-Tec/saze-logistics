import React from "react";

function GlassComponent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-4 w-full h-full m-2 flex items-center justify-center"
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
