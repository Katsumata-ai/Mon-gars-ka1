import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Production-ready rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "error",
      "@next/next/no-img-element": "warn",
      "jsx-a11y/alt-text": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "prefer-spread": "error",
      "no-console": "warn",
    }
  }
];

export default eslintConfig;
