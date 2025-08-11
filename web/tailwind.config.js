/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg-color)",
        text: "var(--text-color)",
        sub: "var(--sub-color)",
        'sub-alt': "var(--sub-alt-color)",
        main: "var(--main-color)",
      },
    },
  },
  plugins: [],
}
