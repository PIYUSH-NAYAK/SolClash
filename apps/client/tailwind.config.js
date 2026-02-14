/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'clash-blue': '#5CA6F6',
                'clash-purple': '#9F5FF2',
                'clash-gold': '#FFC700',
            },
            aspectRatio: {
                'game': '9 / 16',
            },
        },
    },
    plugins: [],
};
