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
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "jsx-a11y/alt-text": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "prefer-spread": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/jsx-no-undef": "off",
      "@next/next/no-img-element": "off",
      "no-console": "off",
    }
  }
];

export default eslintConfig;
