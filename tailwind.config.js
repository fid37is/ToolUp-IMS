/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-geist-sans)'],
                mono: ['var(--font-geist-mono)'],
            },
            colors: {
                foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
                background: 'rgb(var(--background-rgb) / <alpha-value>)',
                slate: {
                    800: '#3A4056', // Hover state
                    900: '#2D3142', // Default state
                }
            },
        },
    },
    plugins: [],
}