module.exports = {
  "*.yml": [
    "eslint"
  ],
  "src/**/*.{js,json}": [
    "eslint --fix",
    "flow focus-check",
    "prettier --write"
  ],
  "src/**/*.css": [
    "stylelint --fix",
    "prettier --write"
  ],
  "package.json": [
    "npmPkgJsonLint -q .",
    () => "pkg-ok"
  ],
  "README.md": [
    "markdownlint -f"
  ]
}