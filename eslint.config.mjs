import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/", "node_modules/", "out/"]),
  {
    rules: {
      // Stricter in eslint-config-next 16; existing patterns unchanged for this upgrade.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
