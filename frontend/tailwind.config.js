/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        fontFamily: {
            sans: ['Poppins', 'sans-serif'],
            poppins: ['Poppins', 'sans-serif'],
        },
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                background: 'var(--color-bg)',
                surface: 'var(--color-surface)',
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                danger: 'var(--color-danger)',
                text: {
                    main: 'var(--color-text-main)',
                    muted: 'var(--color-text-secondary)',
                },
                border: 'var(--color-border)',
                'brand-black': '#8F1E22',
            },
            borderRadius: {
                DEFAULT: 'var(--radius-base)',
                md: 'var(--radius-medium)',
                lg: 'var(--radius-large)',
            },
            boxShadow: {
                card: 'var(--shadow-card)',
                modal: 'var(--shadow-modal)'
            }
        },
    },
    plugins: [],
}
