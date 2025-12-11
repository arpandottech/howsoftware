export const translations = {
    en: {
        // Sidebar
        dashboard: "Dashboard",
        addBooking: "Add Booking",
        bookings: "Bookings",
        expenses: "Expenses",
        finance: "Finance",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout",
        // Settings - Tabs
        pricingConfig: "Pricing Configuration",
        userManagement: "User Management",
        roleManagement: "Role Management",
        general: "General",
        // Settings - General
        appLanguage: "Application Language",
        selectLanguage: "Select Language",
        saveChanges: "Save Changes",
        languageUpdated: "Language updated successfully!"
    },
    hi: {
        dashboard: "डैशबोर्ड",
        addBooking: "बुकिंग जोड़ें",
        bookings: "बुकिंग",
        expenses: "खर्चे",
        finance: "वित्त",
        profile: "प्रोफाइल",
        settings: "सेटिंग्स",
        logout: "लॉग आउट",
        pricingConfig: "मूल्य निर्धारण",
        userManagement: "उपयोगकर्ता प्रबंधन",
        roleManagement: "भूमिका प्रबंधन",
        general: "सामान्य",
        appLanguage: "अनुप्रयोग भाषा",
        selectLanguage: "भाषा चुनें",
        saveChanges: "परिवर्तन सहेजें",
        languageUpdated: "भाषा सफलतापूर्वक अपडेट की गई!"
    },
    gu: {
        dashboard: "ડેશબોર્ડ",
        addBooking: "બુકિંગ ઉમેરો",
        bookings: "બુકિંગ",
        expenses: "ખર્ચ",
        finance: "નાણાકીય",
        profile: "પ્રોફાઇલ",
        settings: "સેટિંગ્સ",
        logout: "લગ આઉટ",
        pricingConfig: "કિંમત રૂપરેખાંકન",
        userManagement: "વપરાશકર્તા મેનેજમેન્ટ",
        roleManagement: "ભૂમિકા મેનેજમેન્ટ",
        general: "સામાન્ય",
        appLanguage: "એપ્લિકેશન ભાષા",
        selectLanguage: "ભાષા પસંદ કરો",
        saveChanges: "ફેરફારો સાચવો",
        languageUpdated: "ભાષા સફળતાપૂર્વક અપડેટ થઈ!"
    },
    mr: {
        dashboard: "डॅशबोर्ड",
        addBooking: "बुकिंग जोडा",
        bookings: "बुकिंग",
        expenses: "खर्च",
        finance: "वित्त",
        profile: "प्रोफाइल",
        settings: "सेटिंग्ज",
        logout: "लॉग आउट",
        pricingConfig: "किंमत संरचना",
        userManagement: "वापरकर्ता व्यवस्थापन",
        roleManagement: "भूमिका व्यवस्थापन",
        general: "सामान्य",
        appLanguage: "अनुप्रयोग भाषा",
        selectLanguage: "भाषा निवडा",
        saveChanges: "बदल जतन करा",
        languageUpdated: "भाषा यशस्वीरित्या अपडेट केली!"
    }
};

export const getTranslation = (lang, key) => {
    return translations[lang]?.[key] || translations['en'][key] || key;
};
