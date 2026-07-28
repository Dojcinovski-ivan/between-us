import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface-2)",
        border: "var(--color-border)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        faint: "var(--color-faint)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          text: "var(--color-accent-text)",
          soft: "var(--color-accent-soft)",
        },
        sage: {
          DEFAULT: "var(--color-sage)",
          hover: "var(--color-sage-hover)",
          soft: "var(--color-sage-soft)",
        },
        crisis: "var(--color-crisis)",
        warn: {
          DEFAULT: "var(--color-danger)",
          soft: "var(--color-danger-soft)",
        },
        // Landing page only, used within .landing-theme.
        dusk: "var(--color-dusk-text)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "'Times New Roman'", "serif"],
        // Landing page only, loaded via next/font and scoped to its
        // wrapper element. Every other page keeps font-serif/font-sans.
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        karla: ["var(--font-karla)", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "gradient-dusk": "var(--gradient-dusk)",
        "gradient-ember": "var(--gradient-ember)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
      transitionTimingFunction: {
        calm: "var(--ease-calm)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        // Landing page only: a slow Ken Burns drift on the hero photo and
        // a one-shot gentle rise-in for hero copy on load.
        drift: {
          from: { transform: "scale(1.02)" },
          to: { transform: "translate3d(-2%, -1.5%, 0) scale(1.08)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite alternate",
        rise: "rise 1s var(--ease-calm) both",
      },
    },
  },
  plugins: [],
};
export default config;
