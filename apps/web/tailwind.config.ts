import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFFFFF",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#E5E5E5",
          500: "#FFFFFF", // Pure crisp white accent (Linear style)
          600: "#E5E5E5",
          700: "#D4D4D4",
          800: "#262626",
          900: "#171717",
        },
        surface: {
          DEFAULT: "#08090A", // Linear's signature pitch black base
          subtle: "#0D0E10",  // Slightly raised dark background
          panel: "#121316",   // Cards, panels, sidebars
          raised: "#18191C",  // Raised dialogs, dropdowns, popovers
          active: "#222428",  // Selected row, active tab
          hover: "#191A1D",   // Row hover
          border: "rgba(255, 255, 255, 0.08)",       // Linear hairline border
          "border-subtle": "rgba(255, 255, 255, 0.05)",
          "border-focus": "rgba(255, 255, 255, 0.25)",
        },
        text: {
          primary: "#F7F8F8",   // Crisp Linear brilliant white
          secondary: "#8A8F98", // Linear muted neutral silver-gray
          tertiary: "#62666D",  // Fine labels, metadata, timestamps
          inverse: "#08090A",   // Black for white button text
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }], // 11px
        xs: ["0.75rem", { lineHeight: "1rem" }],          // 12px
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],      // 13px - Linear standard
        base: ["0.875rem", { lineHeight: "1.375rem" }],    // 14px - Primary text
        md: ["0.9375rem", { lineHeight: "1.5rem" }],       // 15px
        lg: ["1.0625rem", { lineHeight: "1.625rem" }],     // 17px
        xl: ["1.25rem", { lineHeight: "1.75rem" }],        // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }],         // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],    // 30px
        "4xl": ["2.25rem", { lineHeight: "2.75rem" }],     // 36px
        "5xl": ["3.25rem", { lineHeight: "3.5rem" }],      // 52px
        "6xl": ["4rem", { lineHeight: "4.25rem" }],        // 64px
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.025em",
        normal: "0em",
        wide: "0.02em",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.6)",
        dropdown: "0 4px 20px -2px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        modal: "0 16px 40px -4px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        cmdk: "0 24px 60px -8px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.12)",
        glow: "0 0 60px -15px rgba(255, 255, 255, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
