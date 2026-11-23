/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple (India) Design System strict palette
        primary: {
          DEFAULT: "#1D1D1F",
          text: "#1D1D1F",
        },
        accent: {
          DEFAULT: "#0066CC", // Primary accent
          secondary: "#0071E3", // Secondary accent
          hover: "#0055b3",
        },
        highlight: "#2997FF", // Highlight
        background: {
          DEFAULT: "#F5F5F7", // Light background
          light: "#F5F5F7",
          white: "#FFFFFF",
        },
        border: {
          subtle: "#E5E5E7",
          focus: "#0071E3",
        },
      },
      borderRadius: {
        // Strict border radii: 8px, 11px, 980px
        sm: "8px",
        md: "8px",
        lg: "8px",
        xl: "11px",
        "2xl": "11px",
        full: "980px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Metropolis",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      spacing: {
        // 4px-based spacing tokens
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "7": "28px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "14": "56px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
      },
      boxShadow: {
        apple: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "apple-card": "0 4px 20px rgba(0, 0, 0, 0.05)",
        "apple-hover": "0 8px 28px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
