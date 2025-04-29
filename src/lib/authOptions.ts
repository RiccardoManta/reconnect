// Purpose: Re-export authOptions to avoid direct import from pages dir in app dir routes

// Adjust the relative path if your file structure differs slightly
import { authOptions } from '../../pages/api/auth/[...nextauth]';

export { authOptions }; 