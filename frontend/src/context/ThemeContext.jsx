import { createContext, useContext } from 'react';
import { theme } from '../theme/theme';

// Create the context
const ThemeContext = createContext(theme);

/**
 * ThemeProvider
 * Wraps the app to provide the theme object to any component via hook.
 * Since our theme is static for now, we just pass the object constant.
 * But you can expand this to handle Dark/Light mode switching later.
 */
export const ThemeProvider = ({ children }) => {
    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Custom hook to use the theme in components
 * Usage: const { colors } = useTheme();
 */
export const useTheme = () => useContext(ThemeContext);
