import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { signUp, signIn, sendPasswordReset } from '../services/supabaseService';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password';

const Auth: React.FC = () => {
    const [view, setView] = useState<AuthView>('sign_in');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Processing...');

        try {
            switch (view) {
                case 'sign_in':
                    await signIn(email, password);
                    toast.success('Signed in successfully! Redirecting...', { id: toastId });
                    break;
                case 'sign_up':
                    await signUp(email, password);
                    toast.success('Sign up successful! Please check your email to confirm your account.', { id: toastId, duration: 6000 });
                    break;
                case 'forgot_password':
                    await sendPasswordReset(email);
                    toast.success('Password reset email sent! Please check your inbox.', { id: toastId, duration: 6000 });
                    break;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast.error(errorMessage, { id: toastId });
        } finally {
            setLoading(false);
        }
    };
    
    const renderHeader = () => {
        switch (view) {
            case 'sign_in': return 'Sign In to Your Account';
            case 'sign_up': return 'Create a New Account';
            case 'forgot_password': return 'Reset Your Password';
        }
    };
    
    const renderButtonText = () => {
        switch (view) {
            case 'sign_in': return 'Sign In';
            case 'sign_up': return 'Sign Up';
            case 'forgot_password': return 'Send Reset Link';
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-ssk-blue">{renderHeader()}</h1>
                
                <div className="flex justify-center border-b">
                    <button onClick={() => setView('sign_in')} className={`px-4 py-2 text-sm font-medium ${view === 'sign_in' ? 'border-b-2 border-ssk-blue text-ssk-blue' : 'text-gray-500'}`}>Sign In</button>
                    <button onClick={() => setView('sign_up')} className={`px-4 py-2 text-sm font-medium ${view === 'sign_up' ? 'border-b-2 border-ssk-blue text-ssk-blue' : 'text-gray-500'}`}>Sign Up</button>
                </div>

                <form className="space-y-4" onSubmit={handleAuthAction}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 mt-1 border-gray-300 rounded-md shadow-sm focus:ring-ssk-blue focus:border-ssk-blue"
                        />
                    </div>

                    {view !== 'forgot_password' && (
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={view === 'sign_in' ? "current-password" : "new-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 mt-1 border-gray-300 rounded-md shadow-sm focus:ring-ssk-blue focus:border-ssk-blue"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ssk-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ssk-blue disabled:bg-gray-400"
                    >
                        {loading ? 'Loading...' : renderButtonText()}
                    </button>
                </form>

                {view === 'sign_in' && (
                     <div className="text-sm text-center">
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot_password'); }} className="font-medium text-ssk-blue hover:text-blue-800">
                            Forgot your password?
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
