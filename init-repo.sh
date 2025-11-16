#!/bin/bash
# Usage: bash create-date-picker-structure.sh

# Create main structure
mkdir -p public src/components src/tests src/utils

# Root-level files
touch package.json vite.config.ts tsconfig.json README.md .gitignore

# Public folder
touch public/index.html

# Src files
touch src/index.tsx
touch src/App.tsx
touch src/styles.less

# Components, utils, tests
touch src/components/AccessibleDatePicker.tsx
touch src/utils/dateUtils.ts
touch src/tests/AccessibleDatePicker.test.tsx

echo "Project structure created successfully!"
