import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import n from "eslint-plugin-n";
import prettier from "eslint-plugin-prettier";
import eslintPluginJsonc from "eslint-plugin-jsonc";

export default defineConfig([
  globalIgnores(["!**/.*", "**/node_modules/.*", "dist/third-parties.js"]),

  // Base configuration: ESLint recommended, Node plugin, and Prettier integration
  {
    plugins: {
      n,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-inner-declarations": "off",
      "no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
        },
      ],
    },
  },

  // JSON files
  ...eslintPluginJsonc.configs["recommended-with-json"].map((config) => ({
    ...config,
    files: ["**/*.json"],
  })),

  // Custom metrics (Browser / WebPageTest context)
  {
    files: ["dist/**/*.js", "inject-dist/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      parserOptions: {
        ecmaFeatures: {
          globalReturn: true,
        },
      },
      globals: {
        ...globals.browser,
        $WPT_ACCESSIBILITY_TREE: "readonly",
        $WPT_BODIES: "readonly",
        $WPT_COOKIES: "readonly",
        $WPT_DNS: "readonly",
        $WPT_REQUESTS: "readonly",
        $WPT_TEST_URL: "readonly",
        httparchive_enable_observations: "writable",
        __REACT_DEVTOOLS_GLOBAL_HOOK__: "writable",
        CSSUnparsedValue: "readonly",
        LaunchParams: "readonly",
      },
    },
  },

  // CLI and tooling scripts (Node.js context)
  {
    files: ["bin/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },

  // Tests (Node.js + Jest context)
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // Root configuration files (ESM context)
  {
    files: ["*.mjs", ".github/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
]);
