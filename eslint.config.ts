import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"
import { defineConfig } from "eslint/config"

export default defineConfig([
    {
        files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
        plugins: { js },
        extends: ["js/recommended"],
        rules: {
            "vue/multi-word-component-names": "off",
            semi: ["error", "never"],
            quotes: ["error", "double"],
            indent: ["error", 4],
        },
        languageOptions: { globals: globals.browser },
    },
    tseslint.configs.recommended,
    pluginVue.configs["flat/essential"],
    {
        files: ["src/**/*.vue"],
        languageOptions: { parserOptions: { parser: tseslint.parser } },
        rules: {
            "vue/multi-word-component-names": "off",
            semi: ["error", "never"],
            quotes: ["error", "double"],
            indent: ["error", 4],
        },
    },
])
