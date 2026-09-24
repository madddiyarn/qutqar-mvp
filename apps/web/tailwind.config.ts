import type { Config } from "tailwindcss";

export default {
  content: ["apps/web/index.html", "apps/web/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      colors: {
        ink: "#17201E",
        muted: "#69736F",
        line: "#D7D8D2",
        base: "#F2F0E9",
        panel: "#FAF9F5"
      },
      boxShadow: {
        soft: "0 10px 26px rgba(23, 32, 30, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
