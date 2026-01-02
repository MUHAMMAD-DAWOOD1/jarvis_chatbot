/**
 * @fileoverview
 * This file implements a client-side rate limiting system using the browser's localStorage.
 *
 * How it works for multiple users:
 * - This service now requires a `userId` for its operations.
 * - It creates a unique key in `localStorage` for each user (e.g., `jarvis_usage_data_user123`).
 * - This ensures that usage data is completely separate for each authenticated user,
 *   providing an independent rate limit as required.
 */

const MESSAGE_LIMIT = 50; // 50 messages
const TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const STORAGE_KEY_PREFIX = 'jarvis_usage_data_';

const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}${userId}`;

interface UsageData {
    count: number;
    firstMessageTimestamp: number;
}

interface RateLimitStatus {
    isAllowed: boolean;
    resetTime?: Date;
}

export const checkUsage = (userId: string): RateLimitStatus => {
    // Retrieves usage data from the specific user's storage key.
    const storageKey = getStorageKey(userId);
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
        return { isAllowed: true };
    }

    try {
        const data: UsageData = JSON.parse(storedData);
        const now = Date.now();

        // Check if the time window has expired since the first message.
        if (now - data.firstMessageTimestamp > TIME_WINDOW_MS) {
            localStorage.removeItem(storageKey); // Reset for a new time window.
            return { isAllowed: true };
        }

        // Check if the message count is within the defined limit.
        if (data.count >= MESSAGE_LIMIT) {
            const resetTime = new Date(data.firstMessageTimestamp + TIME_WINDOW_MS);
            return { isAllowed: false, resetTime };
        }

        return { isAllowed: true };

    } catch (error) {
        console.error("Error parsing usage data from localStorage:", error);
        localStorage.removeItem(storageKey); // Clear potentially corrupted data.
        return { isAllowed: true };
    }
};

export const incrementUsage = (userId: string): void => {
    const storageKey = getStorageKey(userId);
    const storedData = localStorage.getItem(storageKey);
    const now = Date.now();

    // If no data exists, this is the first message in a new window for this user.
    if (!storedData) {
        const newData: UsageData = {
            count: 1,
            firstMessageTimestamp: now,
        };
        localStorage.setItem(storageKey, JSON.stringify(newData));
        return;
    }

    try {
        const data: UsageData = JSON.parse(storedData);

        // If the current time window has expired, start a new one for this user.
        if (now - data.firstMessageTimestamp > TIME_WINDOW_MS) {
             const newData: UsageData = {
                count: 1,
                firstMessageTimestamp: now,
            };
            localStorage.setItem(storageKey, JSON.stringify(newData));
        } else {
            // Otherwise, just increment the count within the current window.
            data.count++;
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    } catch (error) {
        console.error("Error updating usage data in localStorage:", error);
        // If data is corrupted, start fresh to unblock the user.
         const newData: UsageData = {
            count: 1,
            firstMessageTimestamp: now,
        };
        localStorage.setItem(storageKey, JSON.stringify(newData));
    }
};