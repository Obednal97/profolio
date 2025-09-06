# Contributing to Profolio

Thank you for your interest in contributing to Profolio! Please read this guide carefully before submitting any contributions.

## ⚠️ Important License Notice

**Profolio is NOT open source software.** It is proprietary software with source code made available for specific purposes. By contributing, you agree to our license terms.

## 📋 Contribution Requirements

### Before You Start

1. **Read the [LICENSE](LICENSE)** - Understand that this is proprietary software
2. **No forks for distribution** - Forks are ONLY allowed for submitting pull requests
3. **No modified versions** - You cannot distribute your own version of Profolio
4. **Contributions only** - All modifications must be submitted back to this repository

### Contribution Agreement

By submitting a pull request, you:
- Grant Ollie Bednal an irrevocable, worldwide, royalty-free license to use your contributions
- Confirm you have the right to grant this license
- Understand your contributions become part of the proprietary codebase
- Agree that Profolio remains the only official version

## 🔧 How to Contribute

### 1. Report Issues
- Use [GitHub Issues](https://github.com/Obednal97/profolio/issues)
- Search existing issues first
- Provide clear reproduction steps
- Include system information

### 2. Submit Pull Requests

#### Setup
```bash
# Fork the repository (for PR purposes only)
# Clone your fork
git clone https://github.com/YOUR_USERNAME/profolio.git
cd profolio

# Add upstream remote
git remote add upstream https://github.com/Obednal97/profolio.git

# Create a feature branch
git checkout -b feature/your-feature-name
```

#### Making Changes
1. Keep changes focused and minimal
2. Follow existing code style and conventions
3. Test your changes thoroughly
4. Update documentation if needed

#### Submitting
```bash
# Commit your changes
git add .
git commit -m "feat: describe your change"

# Push to your fork
git push origin feature/your-feature-name

# Create PR via GitHub
```

### 3. Pull Request Guidelines

- **Title**: Use conventional commit format (feat:, fix:, docs:, etc.)
- **Description**: Clearly explain what and why
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include if UI changes
- **Issue Link**: Reference any related issues

## 🚫 What NOT to Do

- ❌ Don't create competing products or services
- ❌ Don't redistribute the software
- ❌ Don't remove license headers or notices
- ❌ Don't claim ownership of the code
- ❌ Don't use for commercial purposes without permission
- ❌ Don't submit AI-generated code without review
- ❌ Don't submit dependencies with incompatible licenses

## 💻 Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Local Development
```bash
# Install dependencies
pnpm install

# Setup database
cd backend
pnpm prisma:migrate

# Run development servers
cd ..
pnpm dev
```

### Testing
```bash
# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📝 Code Style

- Use TypeScript where possible
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write meaningful commit messages

## 🏷️ Commit Convention

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## 🎯 Priority Areas

We especially welcome contributions for:
- Bug fixes
- Documentation improvements
- Test coverage
- Performance optimizations
- Accessibility improvements
- Translation (UI text only, not documentation)

## ❓ Questions?

- Check existing [issues](https://github.com/Obednal97/profolio/issues)
- Review the [documentation](docs/)
- Contact via GitHub issues

## ⚖️ Legal

Remember: All contributions become part of the proprietary Profolio codebase under the Profolio License. If you're not comfortable with this, please do not contribute.

---

**By contributing to Profolio, you acknowledge that you have read, understood, and agree to these contribution guidelines and the project's license terms.**