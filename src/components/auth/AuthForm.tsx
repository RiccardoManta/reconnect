'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false); // Toggle between Login and Signup
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      // Explicitly set callbackUrl to redirect to homepage on success
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
      });

      // This error handling might still be relevant if signIn itself fails
      // or if the callbackUrl redirect fails for some reason.
      if (result?.error) {
        setError(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : result.error);
      } else if (!result?.ok) {
        // Handle cases where it's not an explicit error but not ok
        setError('An unknown login error occurred.');
      }
      // No need for success message here, redirect should happen

    } catch (err) {
      setError('Failed to sign in.');
      console.error('Login Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      // Post to our custom signup API route
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json(); // Attempt to parse JSON regardless of status

      if (!response.ok) {
        // Use message from API response if available, otherwise throw generic error
        throw new Error(data.message || `Signup failed with status: ${response.status}`);
      }

      setMessage(data.message || 'Signup successful! Please log in.');
      setIsSigningUp(false); // Switch back to login form
      setEmail(''); // Clear fields after successful signup
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown signup error occurred.');
      console.error('Signup Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Using the same styling as before
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isSigningUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <form onSubmit={isSigningUp ? handleSignup : handleLogin}>
          {error && <p className="mb-4 text-red-500 text-sm text-center p-3 bg-red-100 rounded-md">{error}</p>}
          {message && <p className="mb-4 text-green-500 text-sm text-center p-3 bg-green-100 rounded-md">{message}</p>}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {isSigningUp && (
            <div className="mb-6">
               <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
               <input
                 type="password"
                 id="confirmPassword"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 required
                 minLength={8}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isSigningUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button" // Ensure this doesn't submit the form
            onClick={() => { setIsSigningUp(!isSigningUp); setError(null); setMessage(null); }} // Clear messages on toggle
            className="font-medium text-blue-600 hover:text-blue-500 bg-transparent border-none p-0 cursor-pointer"
          >
            {isSigningUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
} 