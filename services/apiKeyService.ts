
const API_KEY_STORAGE_KEY = 'jarvis_gemini_api_key';

export const getApiKey = (): string | null => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Could not access localStorage:", error);
        return null;
    }
};

export const saveApiKey = (key: string): void => {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
        console.error("Could not save to localStorage:", error);
    }
};

export const clearApiKey = (): void => {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Could not remove from localStorage:", error);
    }
};
