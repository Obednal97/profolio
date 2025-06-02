# Git Integration Guide
**Automating Enterprise-Grade Standards**

---

## 🎯 **Overview**

This guide shows how to integrate our enterprise-grade standards into your git workflow using hooks, automation, and CI/CD processes to ensure every commit meets our quality requirements.

---

## 🔗 **Pre-Commit Hooks**

### 📝 **Basic Pre-Commit Hook**
Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Enterprise-Grade Pre-Commit Hook

echo "🔍 Running Enterprise Quality Checks..."

# Build verification
echo "📦 Building project..."
cd frontend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

cd ../backend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

# Type checking
echo "🔍 Type checking..."
cd ../frontend && npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found!"
    exit 1
fi

# Linting
echo "✨ Linting code..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting errors found!"
    exit 1
fi

# Security check for hardcoded secrets
echo "🔒 Checking for hardcoded secrets..."
if git diff --cached --name-only | xargs grep -l "sk-\|pk_\|Bearer \|password.*=\|api.*key.*=" 2>/dev/null; then
    echo "❌ Potential hardcoded secrets found!"
    echo "   Review your changes for API keys or passwords"
    exit 1
fi

# Financial precision check
echo "💰 Checking financial calculations..."
if git diff --cached | grep -E "\+.*[0-9]+\s*[\*\+\-\/]\s*[0-9]+" | grep -v "FinancialCalculator" > /dev/null; then
    echo "⚠️  Potential floating-point math on financial data found!"
    echo "   Use FinancialCalculator for monetary operations"
    echo "   Review: docs/processes/QUICK_REFERENCE.md"
fi

# AbortController check for new API calls
echo "🔄 Checking API call patterns..."
if git diff --cached | grep -E "\+.*fetch\(|axios\.|useEffect.*fetch" | grep -v "AbortController\|signal:" > /dev/null; then
    echo "⚠️  New API calls found without AbortController!"
    echo "   Add cleanup patterns for proper resource management"
    echo "   Review: docs/processes/QUICK_REFERENCE.md"
fi

echo "✅ All checks passed! Ready to commit."
```

### 🎯 **Advanced Pre-Commit Hook**
For more comprehensive checking:

```bash
#!/bin/sh
# Advanced Enterprise Pre-Commit Hook

# Source the quality checklist functions
source "$(git rev-parse --show-toplevel)/scripts/quality-checks.sh"

echo "🚀 Running Advanced Quality Checks..."

# Run all quality checks
run_build_checks
run_security_checks  
run_performance_checks
run_financial_checks
run_pattern_checks

if [ $? -eq 0 ]; then
    echo "✅ All enterprise standards met! Commit approved."
else
    echo "❌ Quality standards not met. Please fix issues before committing."
    echo "📖 See: docs/processes/CODE_QUALITY_CHECKLIST.md"
    exit 1
fi
```

---

## 🤖 **Automated Quality Checks Script**

Create `scripts/quality-checks.sh`:

```bash
#!/bin/bash
# Enterprise Quality Automation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build checks
run_build_checks() {
    echo -e "${YELLOW}📦 Building projects...${NC}"
    
    cd frontend
    if ! npm run build > /dev/null 2>&1; then
        echo -e "${RED}❌ Frontend build failed${NC}"
        return 1
    fi
    
    cd ../backend
    if ! npm run build > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend build failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Build checks passed${NC}"
    return 0
}

# Security checks
run_security_checks() {
    echo -e "${YELLOW}🔒 Running security checks...${NC}"
    
    # Check for hardcoded secrets
    if git diff --cached --name-only | xargs grep -l "sk-\|pk_\|Bearer \|password.*=\|api.*key.*=" 2>/dev/null; then
        echo -e "${RED}❌ Hardcoded secrets found${NC}"
        return 1
    fi
    
    # Check for dangerous functions
    if git diff --cached | grep -E "\+.*eval\(|dangerouslySetInnerHTML" > /dev/null; then
        echo -e "${RED}❌ Dangerous functions found${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Security checks passed${NC}"
    return 0
}

# Performance checks
run_performance_checks() {
    echo -e "${YELLOW}⚡ Running performance checks...${NC}"
    
    # Check for missing AbortController
    if git diff --cached | grep -E "\+.*fetch\(|useEffect.*fetch" | grep -v "AbortController\|signal:" > /dev/null; then
        echo -e "${YELLOW}⚠️  Missing AbortController patterns${NC}"
    fi
    
    # Check for heavy operations without memoization
    if git diff --cached | grep -E "\+.*map\(.*=>.*\{|filter\(.*=>.*\{" | grep -v "useMemo\|useCallback" > /dev/null; then
        echo -e "${YELLOW}⚠️  Heavy operations without memoization${NC}"
    fi
    
    echo -e "${GREEN}✅ Performance checks completed${NC}"
    return 0
}

# Financial precision checks
run_financial_checks() {
    echo -e "${YELLOW}💰 Checking financial calculations...${NC}"
    
    if git diff --cached | grep -E "\+.*[0-9]+\s*[\*\+\-\/]\s*[0-9]+" | grep -v "FinancialCalculator" > /dev/null; then
        echo -e "${RED}❌ Raw math on financial data found${NC}"
        echo -e "${YELLOW}   Use FinancialCalculator for monetary operations${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Financial precision checks passed${NC}"
    return 0
}

# Pattern checks
run_pattern_checks() {
    echo -e "${YELLOW}🎯 Checking code patterns...${NC}"
    
    # Check for proper TypeScript usage
    if git diff --cached | grep -E "\+.*: any" > /dev/null; then
        echo -e "${YELLOW}⚠️  'any' types found - prefer specific types${NC}"
    fi
    
    # Check for proper error handling
    if git diff --cached | grep -E "\+.*catch.*\{" | grep -v "error" > /dev/null; then
        echo -e "${YELLOW}⚠️  Catch blocks without error handling${NC}"
    fi
    
    echo -e "${GREEN}✅ Pattern checks completed${NC}"
    return 0
}
```

---

## 📋 **Commit Message Templates**

### 🎯 **Standard Commit Template**
Create `.gitmessage`:

```
<type>(<scope>): <subject>

<body>

Quality Checklist:
- [ ] AbortController patterns implemented
- [ ] FinancialCalculator used for money operations
- [ ] Timer/interval cleanup added
- [ ] Security review completed
- [ ] Performance optimizations applied
- [ ] TypeScript strict compliance
- [ ] Build passes without errors

Breaking Changes:
- [ ] None
- [ ] Migration guide updated

Testing:
- [ ] Unit tests added/updated
- [ ] Integration tests verified
- [ ] Manual testing completed

# Types: feat, fix, docs, style, refactor, perf, test, chore
# Scope: component name, feature area, or file affected
# Subject: imperative mood, no period, 50 chars max
```

Configure git to use this template:
```bash
git config commit.template .gitmessage
```

---

## 🔄 **GitHub Actions Integration**

### 🤖 **Enterprise Quality Workflow**
Create `.github/workflows/quality-check.yml`:

```yaml
name: Enterprise Quality Check

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          frontend/package-lock.json
          backend/package-lock.json
    
    - name: Install Dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && npm ci
    
    - name: Security Check
      run: |
        echo "🔒 Running security checks..."
        # Check for hardcoded secrets
        if grep -r "sk-\|pk_\|Bearer \|password.*=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" frontend/ backend/; then
          echo "❌ Hardcoded secrets found!"
          exit 1
        fi
    
    - name: Build Check
      run: |
        echo "📦 Building projects..."
        cd frontend && npm run build
        cd ../backend && npm run build
    
    - name: Type Check
      run: |
        echo "🔍 Type checking..."
        cd frontend && npm run type-check
    
    - name: Lint Check
      run: |
        echo "✨ Linting..."
        cd frontend && npm run lint
        cd ../backend && npm run lint
    
    - name: Financial Precision Check
      run: |
        echo "💰 Checking financial calculations..."
        if git diff HEAD~1 | grep -E "\+.*[0-9]+\s*[\*\+\-\/]\s*[0-9]+" | grep -v "FinancialCalculator"; then
          echo "⚠️ Raw math on financial data found!"
          echo "Use FinancialCalculator for monetary operations"
        fi
    
    - name: Performance Pattern Check
      run: |
        echo "⚡ Checking performance patterns..."
        if git diff HEAD~1 | grep -E "\+.*fetch\(|useEffect.*fetch" | grep -v "AbortController\|signal:"; then
          echo "⚠️ Missing AbortController patterns found!"
          echo "Add cleanup patterns for API calls"
        fi
    
    - name: Quality Summary
      run: |
        echo "✅ Enterprise quality checks completed!"
        echo "📖 Standards: docs/processes/CODE_QUALITY_CHECKLIST.md"
```

---

## 🎨 **VS Code Integration**

### 🔧 **Workspace Settings**
Create `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.rulers": [50, 100],
  "files.associations": {
    "CODE_QUALITY_CHECKLIST.md": "markdown",
    "QUICK_REFERENCE.md": "markdown"
  },
  "workbench.colorCustomizations": {
    "editorRuler.foreground": "#ff4444"
  },
  "editor.snippets.codeActions.enabled": true
}
```

### 📝 **Code Snippets**
Create `.vscode/snippets.json`:

```json
{
  "AbortController Pattern": {
    "prefix": "abort-pattern",
    "body": [
      "const abortControllerRef = useRef<AbortController | null>(null);",
      "",
      "const cleanup = useCallback(() => {",
      "  if (abortControllerRef.current) {",
      "    abortControllerRef.current.abort();",
      "    abortControllerRef.current = null;",
      "  }",
      "}, []);",
      "",
      "const ${1:fetchData} = useCallback(async () => {",
      "  cleanup();",
      "  const controller = new AbortController();",
      "  abortControllerRef.current = controller;",
      "  ",
      "  try {",
      "    const response = await fetch('${2:/api/endpoint}', {",
      "      signal: controller.signal,",
      "    });",
      "    if (controller.signal.aborted) return;",
      "    // Handle response...",
      "  } catch (error) {",
      "    if (error instanceof Error && error.name === 'AbortError') return;",
      "    // Handle error...",
      "  }",
      "}, [cleanup]);",
      "",
      "useEffect(() => cleanup, [cleanup]);"
    ],
    "description": "AbortController cleanup pattern"
  },
  
  "Financial Calculator": {
    "prefix": "fin-calc",
    "body": [
      "import { FinancialCalculator } from '@/lib/financial';",
      "",
      "const ${1:result} = FinancialCalculator.${2:add}(${3:amount1}, ${4:amount2});",
      "const formatted = FinancialCalculator.formatCurrency(${1:result});"
    ],
    "description": "Financial calculation with precision"
  }
}
```

---

## 📊 **Quality Metrics Tracking**

### 📈 **Quality Report Script**
Create `scripts/quality-report.sh`:

```bash
#!/bin/bash
# Generate quality metrics report

echo "📊 Enterprise Quality Report"
echo "============================"

# Security metrics
echo "🔒 Security:"
SECRET_COUNT=$(grep -r "sk-\|pk_\|Bearer " --include="*.ts" --include="*.tsx" frontend/ backend/ 2>/dev/null | wc -l)
echo "   Hardcoded secrets: $SECRET_COUNT"

# Performance metrics  
echo "⚡ Performance:"
ABORT_MISSING=$(grep -r "fetch(" --include="*.ts" --include="*.tsx" frontend/ | grep -v "AbortController\|signal:" | wc -l)
echo "   Missing AbortController: $ABORT_MISSING"

# Financial precision
echo "💰 Financial:"
RAW_MATH=$(grep -r "[0-9]*\s*[+\-*/]\s*[0-9]" --include="*.ts" --include="*.tsx" frontend/ | grep -v "FinancialCalculator" | wc -l)
echo "   Raw math operations: $RAW_MATH"

# Code quality
echo "📋 Code Quality:"
ANY_TYPES=$(grep -r ": any" --include="*.ts" --include="*.tsx" frontend/ backend/ | wc -l)
echo "   'any' types used: $ANY_TYPES"

echo ""
echo "📖 Review: docs/processes/CODE_QUALITY_CHECKLIST.md"
```

---

## 🔄 **Workflow Integration Examples**

### 🎯 **Feature Development**
```bash
# 1. Start feature
git checkout -b feature/user-dashboard

# 2. Development with quality checks
./scripts/quality-checks.sh

# 3. Commit with template
git commit -m "feat(dashboard): add user analytics

- Implemented AbortController patterns
- Used FinancialCalculator for financial data
- Added proper cleanup for intervals
- Completed security review"

# 4. Pre-push quality gate
git push origin feature/user-dashboard
```

### 🐛 **Bug Fix Workflow**
```bash
# 1. Identify issue
git checkout -b fix/memory-leak-notifications

# 2. Fix with patterns
# Add AbortController, cleanup timers

# 3. Verify fix
./scripts/quality-checks.sh

# 4. Commit with verification
git commit -m "fix(notifications): resolve memory leak

- Added AbortController for API cleanup
- Fixed interval cleanup in useNotifications
- Verified no new memory leaks introduced"
```

---

## 🎓 **Training Integration**

### 📚 **Onboarding Checklist**
```
New Developer Setup:
- [ ] Install pre-commit hooks
- [ ] Configure commit message template  
- [ ] Bookmark quality documentation
- [ ] Complete quality pattern tutorial
- [ ] Pass quality standards quiz
- [ ] Submit first PR with full checklist
```

### 🎯 **Code Review Guidelines**
```
Quality Review Process:
- [ ] Author completed relevant checklist sections
- [ ] All critical patterns implemented
- [ ] Security requirements met
- [ ] Performance standards achieved  
- [ ] Documentation updated
- [ ] CI/CD checks passing
```

---

**Remember**: These integrations automate our enterprise-grade standards. Set them up once and ensure every commit maintains our quality bar automatically.