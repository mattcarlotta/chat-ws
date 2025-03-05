/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
module.exports = {
    plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
    importOrder: [
        "<TYPES>^(node:)",
        "<TYPES>",
        "<TYPES>^[.]",
        "<BUILTIN_MODULES>",
        "<THIRD_PARTY_MODULES>",
        "^(?!.*[.]css$)[./].*$",
        ".css$"
    ],
    importOrderSeparation: false,
    importOrderSortSpecifiers: true,
    semi: true,
    trailingComma: "none",
    singleQuote: false,
    printWidth: 120,
    tabWidth: 4,
    useTabs: false
};
