module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "main-colorsaqua": "var(--main-colorsaqua)",
        "main-colorsaqua-20": "var(--main-colorsaqua-20)",
        "main-colorsbackground": "var(--main-colorsbackground)",
        "main-colorsbackground-alt": "var(--main-colorsbackground-alt)",
        "main-colorsgreen": "var(--main-colorsgreen)",
        "main-colorsorange": "var(--main-colorsorange)",
        "neutralneutral-10": "var(--neutralneutral-10)",
        "neutralneutral-100": "var(--neutralneutral-100)",
        "neutralneutral-20": "var(--neutralneutral-20)",
        "neutralneutral-40": "var(--neutralneutral-40)",
        "neutralneutral-5": "var(--neutralneutral-5)",
        "neutralneutral-60": "var(--neutralneutral-60)",
        "neutralneutral-80": "var(--neutralneutral-80)",
        "neutralneutral-85": "var(--neutralneutral-85)",
        "neutralneutral-90": "var(--neutralneutral-90)",
        "neutralneutral-95": "var(--neutralneutral-95)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        "h1-alternative": "var(--h1-alternative-font-family)",
        h2: "var(--h2-font-family)",
        "left-menu": "var(--left-menu-font-family)",
        "number-1": "var(--number-1-font-family)",
        "paragraph-14": "var(--paragraph-14-font-family)",
        "paragraph-14-medium": "var(--paragraph-14-medium-font-family)",
        "paragraph-16": "var(--paragraph-16-font-family)",
        "paragraph-16-medium": "var(--paragraph-16-medium-font-family)",
        status: "var(--status-font-family)",
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
  },
  plugins: [],
  darkMode: ["class"],
};
