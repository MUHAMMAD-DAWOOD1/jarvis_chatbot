
import React from 'react';
import type { AppMode } from '../types';
import SearchBar from './SearchBar';

interface HeaderProps {
    appMode: AppMode | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ appMode, searchQuery, onSearchChange }) => {
    const title = `Jarvis ${appMode ? `- ${appMode.charAt(0).toUpperCase() + appMode.slice(1)} Mode` : ''}`;

    return (
        <header className="sticky top-0 z-10 p-4 md:p-6 bg-slate-900/70 backdrop-blur-md border-b border-slate-800 animate-fadeIn">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-xl font-semibold text-slate-200 truncate text-center sm:text-left">{title}</h1>
                <div className="w-full sm:w-auto">
                    <SearchBar query={searchQuery} onQueryChange={onSearchChange} />
                </div>
            </div>
        </header>
    );
};

export default Header;