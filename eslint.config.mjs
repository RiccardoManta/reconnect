import globals from "globals";
import tseslint from 'typescript-eslint';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
// import nextPlugin from '@next/eslint-plugin-next'; // Commented out
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
  // React specific configurations (Restored)
  {
    ...pluginReactConfig, // Restored
    files: ["**/*.{ts,tsx}"], 
    settings: {
      react: {
        version: "detect", 
      },
    },
    // Add empty rules object if needed to maintain structure
    // rules: {}
  },
  // Next.js specific configurations (Commented out)
  // {
  //   files: ["**/*.{ts,tsx}"],
  //   plugins: {
  //     '@next/next': nextPlugin,
  //   },
  //   rules: {
  //     ...nextPlugin.configs.recommended.rules,
  //     ...nextPlugin.configs['core-web-vitals'].rules,
  //   },
  // },
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
      // Potentially disable TS rules if they incorrectly trigger on JS
      // '@typescript-eslint/no-var-requires': 'off',
    }
  },
  // Add any custom rules or overrides here using compat if necessary
  // Example: ...compat.env({
  //   es6: true,
  // }),
);
