import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import pluginPrettier from "@vue/eslint-config-prettier";

export default [
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  {
    name: "app/files-to-ignore",
    ignores: [
      "**/dist/**",
      "**/dist-ssr/**",
      "**/coverage/**",
      "**/node_modules/**",
    ],
  },

  ...pluginVue.configs["flat/essential"],
  ...vueTsEslintConfig(),

  {
    name: "app/custom-rules",
    rules: {
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Vue specific
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn",
      // Vuetify data tables use #item.columnName syntax
      "vue/valid-v-slot": ["error", { allowModifiers: true }],
      // TypeScript specific
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  pluginPrettier,
];
