/**
 * Global Theme Tokens based on "Finance Expert Dashboard" aesthetic.
 * You can import this object in JS components or use the ThemeContext.
 */
export const theme = {
    colors: {
        primary: '#2962FF',     // Vivid Blue
        secondary: '#6C757D',   // Cool Gray
        background: '#F7F9FC',  // Pale Blue-Gray
        surface: '#FFFFFF',     // Pure White
        success: '#27AE60',     // Emerald Green
        warning: '#FFA000',     // Amber
        danger: '#EB5757',      // Red
        text: {
            main: '#1A202C',      // Very Dark Navy
            secondary: '#718096', // Slate Gray
            subtle: '#A0AEC0'     // Light Gray
        },
        border: '#E2E8F0'       // Light Border
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        headings: {
            h1: '24px',
            h2: '20px',
            h3: '16px'
        },
        body: '14px',
        caption: '12px'
    },
    radius: {
        base: '8px',
        medium: '12px',
        large: '16px',
        round: '50%'
    },
    shadows: {
        card: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        modal: '0px 10px 40px rgba(0, 0, 0, 0.1)'
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
    }
};
