
import type { Message, ChatSession } from '../types';

const SESSION_INDEX_PREFIX = 'jarvis_sessions_index_';
const SESSION_DATA_PREFIX = 'jarvis_session_data_';

const getIndexKey = (userId: string) => `${SESSION_INDEX_PREFIX}${userId}`;
const getDataKey = (sessionId: string) => `${SESSION_DATA_PREFIX}${sessionId}`;

/**
 * Retrieves the list of chat sessions (metadata) for a user.
 */
export const getSessions = (userId: string): ChatSession[] => {
    const key = getIndexKey(userId);
    const json = localStorage.getItem(key);
    if (!json) return [];
    try {
        return JSON.parse(json).sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt);
    } catch (e) {
        console.error("Error parsing session index", e);
        return [];
    }
};

/**
 * Retrieves the specific messages for a given session ID.
 */
export const getSessionMessages = (sessionId: string): Message[] => {
    const key = getDataKey(sessionId);
    const json = localStorage.getItem(key);
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch (e) {
        console.error("Error parsing session messages", e);
        return [];
    }
};

/**
 * Creates a new session or updates an existing one.
 * If title is not provided for a new session, it defaults to 'New Chat'.
 */
export const saveSession = (userId: string, sessionId: string, messages: Message[], title?: string): ChatSession => {
    // 1. Save Messages
    const dataKey = getDataKey(sessionId);
    localStorage.setItem(dataKey, JSON.stringify(messages));

    // 2. Update Index
    const sessions = getSessions(userId);
    const existingIndex = sessions.findIndex(s => s.id === sessionId);
    
    const preview = messages.length > 0 
        ? (messages[messages.length - 1].text.slice(0, 50) || 'Attachment...') 
        : 'Empty chat';

    const now = Date.now();

    let updatedSession: ChatSession;

    if (existingIndex >= 0) {
        updatedSession = {
            ...sessions[existingIndex],
            updatedAt: now,
            preview,
            title: title || sessions[existingIndex].title
        };
        sessions[existingIndex] = updatedSession;
    } else {
        updatedSession = {
            id: sessionId,
            title: title || 'New Chat',
            updatedAt: now,
            preview
        };
        sessions.unshift(updatedSession);
    }

    localStorage.setItem(getIndexKey(userId), JSON.stringify(sessions));
    return updatedSession;
};

/**
 * Deletes a specific session.
 */
export const deleteSession = (userId: string, sessionId: string): void => {
    // Remove data
    localStorage.removeItem(getDataKey(sessionId));

    // Update index
    const sessions = getSessions(userId);
    const newSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(getIndexKey(userId), JSON.stringify(newSessions));
};

/**
 * Clears all history for a user (legacy function updated).
 */
export const clearHistory = (userId: string): void => {
    const sessions = getSessions(userId);
    sessions.forEach(s => localStorage.removeItem(getDataKey(s.id)));
    localStorage.removeItem(getIndexKey(userId));
};

// Backward compatibility wrapper (optional, can be removed if not used)
export const getHistory = (userId: string): Message[] | null => {
    const sessions = getSessions(userId);
    if (sessions.length > 0) {
        return getSessionMessages(sessions[0].id);
    }
    return null;
};
export const saveHistory = (userId: string, messages: Message[]) => {
    // Only used for migration or single-session logic if needed.
    // For this app, we prefer saveSession.
};
