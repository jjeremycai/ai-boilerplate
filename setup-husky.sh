#!/bin/bash

echo "Setting up Husky Git hooks..."

# Install dependencies
echo "Installing Husky and related packages..."
bun add -d husky lint-staged @commitlint/cli @commitlint/config-conventional

# Initialize Husky
echo "Initializing Husky..."
bunx husky init

# Create pre-commit hook
echo "Creating pre-commit hook..."
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bunx lint-staged
' > .husky/pre-commit

# Create commit-msg hook
echo "Creating commit-msg hook..."
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bunx --no -- commitlint --edit $1
' > .husky/commit-msg

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Create lint-staged config
echo "Creating lint-staged configuration..."
cat > .lintstagedrc.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.css": ["prettier --write"]
}
EOF

# Create commitlint config
echo "Creating commitlint configuration..."
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100]
  }
};
EOF

echo "Husky setup complete! 🎉"
echo ""
echo "Git hooks configured:"
echo "- pre-commit: Runs linting and formatting"
echo "- commit-msg: Validates commit messages follow conventional format"
echo ""
echo "Commit message format: <type>(<scope>): <subject>"
echo "Example: feat(auth): add login functionality"