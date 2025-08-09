import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "*.d.ts",
      "test-*.js",
      "prisma/seed.ts"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow unused variables (common during development)
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Allow unescaped entities in JSX (apostrophes, quotes)
      "react/no-unescaped-entities": "warn",
      
      // Allow explicit any types (sometimes necessary)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Keep critical errors as errors (security, functionality)
      "no-console": "warn",
      "no-debugger": "error",
      
      // React specific warnings instead of errors
      "react-hooks/exhaustive-deps": "warn",
    }
  }
];

export default eslintConfig;
