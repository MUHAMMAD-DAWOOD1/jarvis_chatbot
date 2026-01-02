import type { User } from '../types';

const USERS_KEY = 'jarvis_users';
const CURRENT_USER_KEY = 'jarvis_current_user';

// Helper to get users from localStorage
const getUsers = (): (User & { passwordHash: string })[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save users to localStorage
const saveUsers = (users: (User & { passwordHash: string })[]): void => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Simple pseudo-hashing for simulation purposes.
// In a real app, use a proper hashing library like bcrypt.
const pseudoHash = (password: string): string => {
    return `hashed_${password}_salted`;
};

export const signup = (username: string, password: string): User => {
    if (!username.trim() || !password.trim()) {
        throw new Error('Username and password cannot be empty.');
    }
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }
    const users = getUsers();
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (existingUser) {
        throw new Error('Username already exists. Please choose another one.');
    }

    const newUser: User & { passwordHash: string } = {
        id: `user_${Date.now()}_${Math.random()}`,
        username: username.trim(),
        passwordHash: pseudoHash(password),
    };

    users.push(newUser);
    saveUsers(users);

    const userForSession: User = { id: newUser.id, username: newUser.username };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userForSession));

    return userForSession;
};

export const login = (username: string, password: string): User => {
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.passwordHash !== pseudoHash(password)) {
        throw new Error('Invalid username or password.');
    }
    
    const userForSession: User = { id: user.id, username: user.username };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userForSession));
    
    return userForSession;
};

export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    try {
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        // Handle potential malformed JSON in localStorage
        return null;
    }
};
