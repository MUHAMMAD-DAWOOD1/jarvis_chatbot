import React, { useState } from 'react';
import { login, signup } from '../services/authService';
import type { User } from '../types';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

// SVG Icons for the form
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>);

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = isLogin ? login(username, password) : signup(username, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(160deg, #e0f2fe, #f5f3ff)' }}>
        <div className="w-full max-w-sm bg-white/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 animate-fadeIn text-slate-900">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-2">{isLogin ? 'Welcome back' : 'Hello'}</h1>
                <p className="text-slate-600 mb-8">{isLogin ? "Let's get you signed back in." : "Start your journey with JARVIS."}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <input
                        id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                        className="block w-full bg-white/40 border border-slate-300/50 rounded-lg shadow-sm py-3 px-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                        placeholder="Username"
                    />
                </div>

                <div className="relative">
                    <input
                        id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                        className="block w-full bg-white/40 border border-slate-300/50 rounded-lg shadow-sm py-3 px-4 pr-10 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                        placeholder="Password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800" aria-label="Toggle password visibility">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
              
                {error && <p className="text-red-600 text-sm text-center pt-1">{error}</p>}

                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400 focus:ring-offset-white/30 transition transform hover:scale-105"
                    >
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                    className="font-medium text-violet-600 hover:text-violet-800 ml-1"
                >
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </p>
        </div>
    </div>
  );
};

export default Auth;