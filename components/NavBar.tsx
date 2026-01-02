
import React from 'react';
import type { User } from '../types';

const NavTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="group relative flex justify-center">
        {children}
        <span className="absolute left-14 w-auto p-2 m-2 min-w-max rounded-md shadow-md text-slate-800 bg-slate-100 border border-slate-200 nav-tooltip text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100 z-10">
            {text}
        </span>
    </div>
);

// Icon Components
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>);
const NewChatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const SunIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const MoonIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);


interface NavButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    isSelected?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, children, isSelected }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-xl transition-colors nav-button ${
            isSelected
            ? 'bg-cyan-500/20 text-cyan-300'
            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const UserAvatar: React.FC<{ username: string }> = ({ username }) => (
    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-cyan-400 select-none">
        {username.charAt(0).toUpperCase()}
    </div>
);

interface NavBarProps {
    user: User | null;
    onLogout: () => void;
    onNewChatClick: () => void;
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ user, onLogout, onNewChatClick, theme, onThemeToggle, onToggleSidebar, isSidebarOpen }) => {
    return (
        <nav className="fixed bottom-0 w-full h-16 bg-slate-900/50 backdrop-blur-md border-t border-slate-800 flex items-center justify-around nav-bar animate-fadeIn z-30 md:relative md:w-20 md:h-screen md:flex-col md:justify-between md:py-5 md:border-t-0 md:border-r">
            <div className="hidden md:flex flex-col items-center gap-6">
                {/* User Avatar Group with Hamburger */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <button 
                            onClick={onToggleSidebar}
                            className="p-2 rounded-full hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                            title="Toggle History"
                        >
                            <MenuIcon />
                        </button>
                    </div>
                    
                    {user ? (
                    <UserAvatar username={user.username} />
                    ) : (
                        <div className="w-10 h-10 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white font-bold text-xl">J</div>
                    )}
                </div>

                <NavTooltip text="New Chat">
                    <NavButton onClick={onNewChatClick}><NewChatIcon /></NavButton>
                </NavTooltip>
            </div>
            
            {/* Mobile View */}
            <div className="flex md:hidden w-full justify-around items-center">
                <button onClick={onToggleSidebar} className="p-3 text-slate-400 hover:text-white">
                    <MenuIcon />
                </button>
                
                <NavTooltip text="New Chat">
                     <NavButton onClick={onNewChatClick}><NewChatIcon /></NavButton>
                </NavTooltip>

                <NavTooltip text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                    <NavButton onClick={onThemeToggle}>
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </NavButton>
                </NavTooltip>
                 {user && (
                     <NavButton onClick={onLogout}><LogoutIcon /></NavButton>
                 )}
            </div>

            {/* Desktop Bottom Icons */}
            <div className="hidden md:flex flex-col items-center gap-4">
                <NavTooltip text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                    <NavButton onClick={onThemeToggle}>
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </NavButton>
                </NavTooltip>
                 {user && (
                    <NavTooltip text="Logout">
                         <NavButton onClick={onLogout}><LogoutIcon /></NavButton>
                    </NavTooltip>
                 )}
            </div>
        </nav>
    );
};

export default NavBar;
