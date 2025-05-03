'use client';

import React, { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Use 'next/navigation' in App Router
import Image from 'next/image'; // For logo

// Define styles using CSS-in-JS for simplicity with variables
// You could also use Tailwind classes if preferred
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--background, #F5F7FA)', // Use global CSS variable
    padding: '2rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem 3rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  },
  logoContainer: {
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: 'var(--primary, #0F3460)', // Use global CSS variable
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#6b7280', // Gray-500
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--foreground, #333333)', // Use global CSS variable
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db', // Gray-300
    borderRadius: '0.375rem',
    fontSize: '1rem',
    boxSizing: 'border-box', // Important for padding + width
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputFocus: { // We'll handle focus with JS or pseudo-classes if needed
    // Example: borderColor: 'var(--primary-light, #39A2DB)', 
    //         boxShadow: '0 0 0 2px rgba(57, 162, 219, 0.2)',
    //         outline: 'none',
  },
  button: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--primary, #0F3460)', // Use global CSS variable
    color: 'white',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '0.5rem',
  },
  buttonHover: { // Handle with :hover pseudo-class if possible
    // Example: backgroundColor: 'var(--primary-light, #39A2DB)',
  },
  toggleText: {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#4b5563', // Gray-600
  },
  toggleLink: {
    color: 'var(--primary-light, #39A2DB)', // Use global CSS variable
    fontWeight: 500,
    cursor: 'pointer',
    marginLeft: '0.25rem',
    textDecoration: 'underline',
  },
  errorMessage: {
    backgroundColor: '#fee2e2', // Red-100
    color: '#b91c1c', // Red-700
    padding: '0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    marginTop: '1rem',
    textAlign: 'center',
  },
};

export default function LoginSignupPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For signup
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Prevent NextAuth from redirecting automatically
        email,
        password,
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : 'An unknown error occurred.');
        console.error("Login Error:", result.error);
      } else if (result?.ok) {
        // Login successful, redirect to home or intended page
        router.push('/'); // Redirect to homepage after successful login
        // Or use router.push(result.url || '/'); if callbackUrl is configured
      } else {
         setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error("Login submit error:", err);
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // --- THIS IS WHERE YOU CALL YOUR CUSTOM SIGNUP API ---
      // Example:
      const response = await fetch('/api/auth/register', { // Replace with your actual signup endpoint
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
      } else {
        // Signup successful! Optionally log the user in automatically.
        console.log('Signup successful:', data.message);
        // setIsLoginView(true); // Switch to login view
        // Or attempt automatic login:
        const loginResult = await signIn('credentials', { redirect: false, email, password });
        if (loginResult?.ok) {
          router.push('/');
        } else {
          // Show login view with a message or handle login error
          setError('Signup successful, but auto-login failed. Please log in.');
          setIsLoginView(true);
        }
      }
    } catch (err) {
      console.error("Signup submit error:", err);
      setError('An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---
  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          {/* Assuming logo.png is in public directory */}
          <Image src="/logo.png" alt="Reconnect Logo" width={60} height={60} priority />
        </div>
        <h1 style={styles.title}>
          {isLoginView ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p style={styles.subtitle}>
          {isLoginView ? 'Sign in to access your dashboard.' : 'Enter your details to get started.'}
        </p>

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={isLoginView ? handleLoginSubmit : handleSignupSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {!isLoginView && (
             <div style={styles.inputGroup}>
               <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
               <input
                 type="password"
                 id="confirmPassword"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 required
                 placeholder="••••••••"
                 style={styles.input}
                 disabled={loading}
               />
             </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <span
            onClick={() => { if (!loading) { setIsLoginView(!isLoginView); setError(null); } }}
            style={styles.toggleLink}
          >
            {isLoginView ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
} 