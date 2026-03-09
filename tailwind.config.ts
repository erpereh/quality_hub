import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
                mono: ["var(--font-jetbrains)", "monospace"],
            },
            colors: {
                brand: {
                    50: "#eef6ff",
                    100: "#d9ebff",
                    200: "#bcdcff",
                    400: "#6db4ff",
                    500: "#3d94fd",
                    600: "#2574f2",
                    700: "#1a5ddf",
                    800: "#1c4cb5",
                    900: "#1c428e",
                },
                diff: {
                    light: "#fef2f2",
                    medium: "#fecaca",
                    border: "#fca5a5",
                },
            },
        },
    },
    plugins: [],
};
export default config;
