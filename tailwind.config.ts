import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FBF8F3",
        ink: "#3A3A3A",
        muted: "#7A7A7A",
        line: "#E8E2D7",
        weekend: "#F1EEE9",
        leave: {
          full: "#C8DCC2",
          half: "#F8D7B8",
          travel: "#C9DCEA",
          medical: "#EAC4C9",
          childcare: "#D9CFE6",
          important: "#F5DDA2",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 6px 24px -12px rgba(58, 58, 58, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
