import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { queryOne } from "../../../src/db/dbUtils"; // Adjust path if needed
import { RowDataPacket } from "mysql2/promise";
import bcrypt from 'bcrypt';

// Interface for user data from our DB (using user_id)
interface DbUser extends RowDataPacket {
  user_id: number; // Use user_id
  email: string;
  password_hash: string;
  // Add user_name etc. if needed for session
}

// --- Type Augmentation for next-auth --- 
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id: string; // Add id property
    } & NextAuthUser; // Keep default properties like name, email, image
  }

  // The User object returned by the authorize function or adapter methods
  // Already includes id, name, email, image by default - just ensure types match if needed
  // interface User { id: string; } // Usually not needed unless overriding defaults
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id?: string; // Add id to the token
  }
}
// --- End Type Augmentation ---

// Ensure NEXTAUTH_SECRET is set in environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Environment variable NEXTAUTH_SECRET is not set.");
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the default sign-in page.
      // You can specify which fields should be submitted.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req): Promise<NextAuthUser | null> {
        // Add logic here to look up the user from the credentials supplied
        if (!credentials?.email || !credentials?.password) {
          console.error('Authorize: Missing email or password');
          return null; // Or throw an error
        }

        try {
          // Select user_id from the database
          const user = await queryOne<DbUser>(
            'SELECT user_id, email, password_hash FROM users WHERE email = ?', // Use user_id
            [credentials.email]
          );

          if (user) {
            // Check password
            const isValid = await bcrypt.compare(credentials.password, user.password_hash);
            if (isValid) {
              console.log(`Authorize successful for: ${user.email}, UserID: ${user.user_id}`);
              // Map user_id to id for next-auth user object
              return {
                id: user.user_id.toString(), // Map db user_id to next-auth id (string)
                email: user.email,
                // name: user.user_name, // Map if you have user_name and need it
              };
            } else {
              console.log(`Authorize failed (password mismatch) for: ${credentials.email}`);
              return null;
            }
          } else {
            // User not found
            console.log(`Authorize failed (user not found) for: ${credentials.email}`);
            return null;
          }
        } catch (error) {
          console.error('Authorize error:', error);
          return null; // Return null on database or other errors
        }
      }
    })
    // ...add more providers here like Google, GitHub etc.
  ],
  // Use JWT strategy for sessions
  session: {
    strategy: "jwt",
    // maxAge: 30 * 24 * 60 * 60, // Optional: Session expiry (e.g., 30 days)
  },
  // Secret for signing JWTs, CSRF protection etc.
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed.
  callbacks: {
    // Add user id to the JWT token
    async jwt({ token, user }) {
      if (user) {
        // On sign in, add user.id to the token
        token.id = user.id;
      }
      return token;
    },
    // Add user id to the session object available on the client
    async session({ session, token }) {
      if (token?.id && session.user) {
        // Add the id from the token to the session user object
        session.user.id = token.id; // Assign id from token to session
      }
      return session;
    },
  },

  // Use the combined login/signup page
  pages: {
    signIn: '/auth/login-signup', // Path to the new combined page
    // error: '/auth/error', // Optionally create a custom error page too
  },

  // Debugging
  // debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions); 