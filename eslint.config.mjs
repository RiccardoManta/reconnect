import globals from "globals";
import tseslint from 'typescript-eslint';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import nextPlugin from '@next/eslint-plugin-next';
import { FlatCompat } from "@eslint/eslintrc"; // Keep for potential custom rules if needed
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Base configuration using tseslint helper
export default tseslint.config(
  {
    // Apply general recommended rules
    ignores: ["node_modules", ".next/"], // Ignore common directories
  },
  // TypeScript specific configurations
  ...tseslint.configs.recommended, // Base TS rules
  // React specific configurations
  {
    ...pluginReactConfig, // React recommended rules
    files: ["**/*.{ts,tsx}"], // Apply only to TS/TSX
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
  },
  // Next.js specific configurations
  {
    files: ["**/*.{ts,tsx}"], // Apply to TS/TSX
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules, // Apply Next.js recommended rules
      ...nextPlugin.configs['core-web-vitals'].rules, // Apply Core Web Vitals rules
    },
  },
  // General language options for all relevant files
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
       parserOptions: {
         ecmaVersion: 'latest',
         sourceType: 'module',
       },
    },
  },
   // Override for JS files in src/db to allow require
   {
    files: ["src/db/**/*.js"], // Only apply to JS files in src/db
    languageOptions: {
        sourceType: 'commonjs', // These are likely CommonJS modules
        globals: {
            ...globals.node, 
        }
    },
    rules: {
      // Rules from tseslint won't apply here as it's JS, but if you have JS rules disable them
      // For example, if you had a rule against require:
      // "no-restricted-globals": "off", 
    }
  },
  // Add any custom rules or overrides here using compat if necessary
  // Example: ...compat.env({
  //   es6: true,
  // }),
);
