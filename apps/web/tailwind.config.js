export default {
  darkMode: "class", // Enables toggling dark mode with a class
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)", // Main brand color
        accent: "var(--color-accent)", // Secondary accent
        highlight: "var(--color-highlight)", // Hover/highlight color
        neutral: "var(--color-neutral)", // Grayscale
        background: "var(--color-background)", // Background color
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        ":root": {
          "--color-primary": "#1D5BBF", // Light mode primary color
          "--color-accent": "#093A76",
          "--color-highlight": "#2081E5",
          "--color-neutral": "#6D6E71",
          "--color-background": "#F4F4F4",
        },
        ".dark": {
          "--color-primary": "#2081E5", // Dark mode primary color
          "--color-accent": "#093A76",
          "--color-highlight": "#1D5BBF",
          "--color-neutral": "#A9A9A9",
          "--color-background": "#1F2937",
        },
      });
    },
  ],
};
