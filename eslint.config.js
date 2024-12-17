import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs["recommended"].rules,
      // Customize any type warnings
      "@typescript-eslint/no-explicit-any": "off",
      // "semi": ["error", "always"],
      // "indent": ["error", 2],
      // "quotes": ["error", "single"],
      // "comma-dangle": ["error", "always-multiline"],
      // "no-multiple-empty-lines": ["error", { "max": 1 }],
      // "no-trailing-spaces": "error",
      // "eol-last": ["error", "always"],
      // "prettier/prettier": ["error", {
      //   "singleQuote": true,
      //   "semi": true,
      //   "trailingComma": "all",
      //   "tabWidth": 2
      // }]
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        module: "readonly",
      }
    },
    // rules: {
    //   "semi": ["error", "always"],
    //   "indent": ["error", 2],
    //   "quotes": ["error", "single"]
    // }
  },
  {
    ignores: ["cdk.out/**", "node_modules/**"],
  },
];