/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F3460", // dark blue
          light: "#39A2DB", // light turquoise-blue
        },
        background: "#FFFFFF", // white
      },
      borderRadius: {
        card: "0.25rem",
      },
    },
  },
  plugins: [],
}; 