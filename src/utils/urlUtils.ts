/**
 * Gets the base URL of the application, handling both server and client side
 * @returns The base URL (protocol, host, and port) of the current application instance
 */
export function getBaseUrl(): string {
  // If in the browser, use the current window location
  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }
  
  // In a server context, try to use the NEXTAUTH_URL env variable
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Fallback to localhost if nothing else available (shouldn't reach here in production)
  return 'http://localhost:3000';
} 