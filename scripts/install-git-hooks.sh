#!/bin/bash

# Install Git Hooks for Profolio
# Automates pre-commit validation to prevent broken commits

set -e

echo "🔗 Installing Git hooks for Profolio..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Run this from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Profolio Pre-commit Hook
# Automatically runs quality checks before allowing commits

echo "🔍 Running pre-commit checks..."

# Check if this is a release commit (contains version number)
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE" 2>/dev/null || echo "")
    if [[ "$COMMIT_MSG" =~ v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
        echo "🚀 Release commit detected - skipping some checks"
        RELEASE_COMMIT=true
    fi
fi

# Function to print colored output
print_status() {
    echo -e "\033[0;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[0;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

# Check for merge conflicts
if grep -r "<<<<<<< " --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" . 2>/dev/null; then
    print_error "Merge conflict markers found! Please resolve conflicts before committing."
    exit 1
fi

# Check for TODO comments in commit
if git diff --cached | grep -i "TODO\|FIXME\|XXX" > /dev/null; then
    print_warning "TODO/FIXME comments found in staged changes"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run TypeScript checks
echo "📝 Checking TypeScript..."
if ! npm run type-check > /dev/null 2>&1; then
    print_error "TypeScript check failed!"
    echo "Run 'npm run type-check' to see errors"
    exit 1
fi
print_status "TypeScript checks passed"

# Run linting (with auto-fix)
echo "🔍 Running linting..."
if ! npm run lint > /dev/null 2>&1; then
    print_warning "Linting issues found - attempting auto-fix..."
    npm run lint 2>/dev/null || true
    
    # Re-stage auto-fixed files
    git add -u
    print_status "Auto-fix applied and files re-staged"
fi

# Quick build check for critical files only
echo "🔨 Quick build validation..."
STAGED_FILES=$(git diff --cached --name-only)
CRITICAL_FILES=$(echo "$STAGED_FILES" | grep -E "\.(ts|tsx|js|jsx)$" | head -10 || echo "")

if [ ! -z "$CRITICAL_FILES" ] && [ "$RELEASE_COMMIT" != "true" ]; then
    # For non-release commits with code changes, do a quick type check
    if ! npm run type-check > /dev/null 2>&1; then
        print_error "Critical: Code changes failed type check"
        exit 1
    fi
fi

# Check for large files
LARGE_FILES=$(git diff --cached --name-only | xargs ls -la 2>/dev/null | awk '$5 > 1048576 {print $9 " (" $5 " bytes)"}' || echo "")
if [ ! -z "$LARGE_FILES" ]; then
    print_warning "Large files detected:"
    echo "$LARGE_FILES"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for secrets/sensitive data
if git diff --cached | grep -iE "(password|secret|key|token|api[_-]?key)" | grep -v "PASSWORD_PATTERN\|SECRET_EXAMPLE" > /dev/null; then
    print_error "Potential secrets detected in staged changes!"
    echo "Found potentially sensitive data:"
    git diff --cached | grep -iE "(password|secret|key|token|api[_-]?key)" | head -5
    exit 1
fi

print_status "All pre-commit checks passed!"
echo "✨ Ready to commit"
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create prepare-commit-msg hook for commit message formatting
cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/bash

# Profolio Commit Message Preparation Hook
# Helps format commit messages according to project standards

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only process regular commits (not merges, squashes, etc.)
if [ "$COMMIT_SOURCE" != "message" ] && [ "$COMMIT_SOURCE" != "template" ] && [ -z "$COMMIT_SOURCE" ]; then
    
    # Check if this looks like a release commit
    if git diff --name-only --cached | grep -q "package\.json\|CHANGELOG\.md"; then
        # Don't modify release commits
        exit 0
    fi
    
    # Get list of modified files for context
    MODIFIED_FILES=$(git diff --name-only --cached | head -5 | tr '\n' ' ')
    
    # If the commit message is empty or very short, provide a template
    CURRENT_MSG=$(cat "$COMMIT_MSG_FILE")
    if [ ${#CURRENT_MSG} -lt 10 ]; then
        cat > "$COMMIT_MSG_FILE" << EOL
# Commit message format: type: brief description - details - impact
# 
# Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci
# 
# Example:
# feat: add notification badge - shows unread count on user avatar - improves user awareness of pending notifications
# 
# Modified files: $MODIFIED_FILES
# 
# Uncomment and edit the template below:
# feat: 

EOL
    fi
fi
EOF

chmod +x .git/hooks/prepare-commit-msg

echo "✅ Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  • pre-commit: Runs type checking, linting, and security checks"
echo "  • prepare-commit-msg: Helps format commit messages"
echo ""
echo "To test the pre-commit hook:"
echo "  git add . && git commit -m \"test: verify pre-commit hook\""
echo ""
echo "To bypass hooks (emergency only):"
echo "  git commit --no-verify" 