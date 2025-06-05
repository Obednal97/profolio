# 🤝 Contributing to Profolio

Thank you for your interest in contributing to Profolio! We welcome contributions from everyone, whether you're fixing bugs, adding features, improving documentation, or spreading the word.

## 📋 **Getting Started**

### **Prerequisites**

- **Node.js 18+** and **pnpm 9.14.4+** (we use pnpm for better performance and security)
- **Git knowledge** and familiarity with GitHub workflows
- **TypeScript familiarity** (helpful for type safety)
- **PostgreSQL** (optional for development - can use mock data)
- **Docker** (optional for database development)

### **Important: We Use pnpm**

Profolio has migrated from npm to **pnpm** for better performance, security, and dependency management. Please use pnpm for all package operations.

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm@9.14.4

# Verify installation
pnpm --version  # Should show 9.14.4+
```

## 🏗️ **Development Setup**

### **Quick Start (5 minutes)**

```bash
# 1. Fork and clone repository
git clone https://github.com/YOUR_USERNAME/profolio.git
cd profolio

# 2. Install dependencies for both backend and frontend (using pnpm)
cd backend && pnpm install
cd ../frontend && pnpm install

# 3. Setup environment files
# Backend .env (development)
echo 'DATABASE_URL="postgresql://profolio:dev123@localhost:5432/profolio_dev"
JWT_SECRET="dev-jwt-secret-change-in-production"
API_ENCRYPTION_KEY="dev-encryption-key-change-in-production"
NODE_ENV=development
PORT=3001' > backend/.env

# Frontend .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_MODE=local
NODE_ENV=development' > frontend/.env.local

# 4. Generate Prisma client
cd backend && pnpm prisma generate

# 5. Start development servers
# Terminal 1: Backend
cd backend && pnpm run start:dev

# Terminal 2: Frontend
cd frontend && pnpm run dev

# 6. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### **Database Setup Options**

#### **Option A: Mock Data (Recommended for UI Development)**

- No database setup required
- Perfect for frontend/UI development
- Uses sample data for development
- Fastest way to get started

#### **Option B: Local PostgreSQL with Docker**

```bash
# Start PostgreSQL in Docker
docker run --name profolio-dev-db -p 5432:5432 \
  -e POSTGRES_DB=profolio_dev \
  -e POSTGRES_USER=profolio \
  -e POSTGRES_PASSWORD=dev123 \
  -d postgres:15

# Run database migrations
cd backend && pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate
```

#### **Option C: Local PostgreSQL Installation**

```bash
# Install PostgreSQL (varies by OS)
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew:
brew install postgresql
brew services start postgresql

# Create development database
sudo -u postgres createdb profolio_dev
sudo -u postgres createuser profolio

# Run migrations and generate client
cd backend && pnpm prisma migrate dev && pnpm prisma generate
```

### **Development Workflow**

#### **Day-to-Day Development:**

1. **Work Locally** - Make changes on your local machine
2. **Test Locally** - Verify everything works with development servers
3. **Create Feature Branch** - `git checkout -b feature/my-feature`
4. **Make Changes** - Follow code guidelines and quality checklist
5. **Run Quality Checks** - Linting, type checking, build verification
6. **Test Changes** - Run tests and manual testing
7. **Push to GitHub** - `git push origin feature/my-feature`
8. **Create Pull Request** - Review changes before merging

#### **Essential Development Commands**

```bash
# Start development with hot reload
pnpm run dev:backend    # Backend with hot reload (port 3001)
pnpm run dev:frontend   # Frontend with hot reload (port 3000)

# Database operations
pnpm prisma studio      # Visual database browser
pnpm prisma migrate dev # Run new migrations
pnpm prisma generate    # Regenerate Prisma client (REQUIRED after schema changes)

# Code quality and validation
pnpm run lint           # Check code style (ESLint)
pnpm run type-check     # TypeScript type checking
pnpm run build          # Production build verification
pnpm test              # Run tests
pnpm run format         # Format code (Prettier)
```

### **Pre-Commit Quality Checklist**

Use our comprehensive [Code Quality Checklist](docs/processes/CODE_QUALITY_CHECKLIST.md) to ensure:

- **Security standards** - No hardcoded secrets, proper input validation
- **Performance optimization** - React memoization, efficient queries
- **Type safety** - TypeScript strict mode compliance
- **pnpm compliance** - All commands use pnpm, not npm
- **Build verification** - `pnpm run build` succeeds
- **Prisma client validation** - Database models accessible after `pnpm prisma generate`

### **Development Tools**

#### **Required:**

```bash
node --version  # v18+ required
pnpm --version  # v9.14.4+ required (not npm!)
git --version   # v2.30+ recommended
```

#### **Recommended:**

- **VS Code** - With TypeScript, Prisma, and ESLint extensions
- **Postman** - For API testing
- **Docker** - For database development
- **Git GUI** - GitHub Desktop, GitKraken, or VS Code Git

#### **Essential VS Code Extensions:**

- **TypeScript and JavaScript Language Features** (built-in)
- **Prisma** - Database schema and client support
- **Tailwind CSS IntelliSense** - CSS class autocomplete
- **ESLint** - Code quality and security linting
- **Prettier** - Code formatting
- **Auto Rename Tag** - HTML/JSX tag synchronization

## 🐛 **Reporting Issues**

### **Bug Reports**

Please include:

- **Clear description** of the issue and expected behavior
- **Steps to reproduce** with specific actions taken
- **System information** (OS, Node.js/pnpm version, browser)
- **Environment details** (development/production, authentication mode)
- **Screenshots** if applicable (especially for UI issues)
- **Error messages** from console/logs (browser console and terminal)
- **Package manager used** (should be pnpm for consistency)

### **Feature Requests**

Please include:

- **Clear description** of the proposed feature
- **Use case and motivation** - Why is this feature valuable?
- **User stories** - How would users interact with this feature?
- **Implementation suggestions** (if any)
- **Mockups or examples** from other applications

## 🔧 **Making Changes**

### **Code Guidelines**

#### **General Standards:**

- **Use TypeScript** for all new code with strict type checking
- **Follow existing patterns** and architectural decisions
- **Add proper type definitions** - No `any` types without justification
- **Include JSDoc comments** for public APIs and complex logic
- **Write self-documenting code** with clear, descriptive names
- **Follow security best practices** from our security checklist

#### **pnpm Package Management:**

```bash
# ✅ CORRECT: Use pnpm for all operations
pnpm install package-name
pnpm run build
pnpm run test
pnpm run dev

# ❌ WRONG: Don't use npm or yarn
npm install package-name  # Don't use this
yarn add package-name     # Don't use this
```

#### **Backend (NestJS with Prisma):**

```typescript
// Example: Proper service structure with Prisma
@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user portfolio with positions and performance metrics
   * @param userId - User identifier
   * @returns Portfolio with positions and calculated metrics
   */
  async getPortfolio(userId: string): Promise<PortfolioWithMetrics> {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { userId },
      include: {
        positions: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    return this.calculateMetrics(portfolio);
  }
}
```

**Backend Best Practices:**

- **Follow NestJS conventions** with proper decorators and dependency injection
- **Use Prisma for all database operations** - No raw SQL unless absolutely necessary
- **Add comprehensive error handling** with appropriate HTTP exceptions
- **Include unit tests** for new services and complex business logic
- **Validate all inputs** using class-validator decorators
- **Use proper logging** with structured log formats

#### **Frontend (Next.js with TypeScript):**

```typescript
// Example: Proper component structure with performance optimization
interface PortfolioCardProps {
  portfolio: Portfolio;
  onUpdate?: (portfolio: Portfolio) => void;
  className?: string;
}

export const PortfolioCard = memo(function PortfolioCard({
  portfolio,
  onUpdate,
  className,
}: PortfolioCardProps) {
  const handleUpdate = useCallback(
    (updatedPortfolio: Portfolio) => {
      onUpdate?.(updatedPortfolio);
    },
    [onUpdate]
  );

  return (
    <div className={cn("portfolio-card", className)}>
      {/* Component implementation with proper loading states */}
    </div>
  );
});
```

**Frontend Best Practices:**

- **Use functional components** with hooks (no class components)
- **Follow React performance best practices** - memo, useCallback, useMemo where appropriate
- **Use Tailwind CSS** for styling with consistent design system
- **Ensure responsive design** (mobile-first approach)
- **Add proper TypeScript interfaces** for all props and state
- **Handle loading and error states** gracefully
- **Use Next.js App Router** for new pages and layouts

#### **Database (Prisma Schema):**

```prisma
// Example: Proper model structure with relationships
model Portfolio {
  id        String   @id @default(cuid())
  userId    String
  name      String
  currency  String   @default("GBP")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  positions Position[]

  @@map("portfolios")
  @@index([userId])
}
```

**Database Best Practices:**

- **Use descriptive model and field names** following UK conventions
- **Add proper relations and constraints** with cascade deletes where appropriate
- **Include created/updated timestamps** for audit trails
- **Use appropriate field types** and default values
- **Add database indexes** for frequently queried fields
- **Test migrations locally** before committing

### **Commit Messages & Git Workflow**

#### **Commit Message Format**

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
# Format: type(scope): description
feat(portfolio): add portfolio performance analytics dashboard
fix(auth): resolve JWT token expiration handling in demo mode
docs(setup): update installation guide with pnpm requirements
test(api): add unit tests for authentication service
refactor(database): improve error handling in Prisma client
style: format code with prettier and fix linting issues
perf(frontend): optimize component re-renders with React.memo
security(api): add input validation for portfolio creation
```

#### **Pull Request Process**

1. **Create Feature Branch:**

   ```bash
   git checkout -b feature/portfolio-analytics
   # or
   git checkout -b fix/authentication-bug
   # or
   git checkout -b docs/pnpm-migration
   ```

2. **Make Changes Following Quality Standards:**

   - Write clean, well-documented code
   - Follow the [Code Quality Checklist](docs/processes/CODE_QUALITY_CHECKLIST.md)
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure pnpm compliance throughout

3. **Test Your Changes Thoroughly:**

   ```bash
   # Backend validation
   cd backend
   pnpm run lint
   pnpm run type-check
   pnpm run build
   pnpm test
   pnpm prisma generate  # Verify Prisma client generation

   # Frontend validation
   cd frontend
   pnpm run lint
   pnpm run type-check
   pnpm run build
   pnpm test

   # Manual testing checklist
   # - Test in development environment (pnpm run dev)
   # - Check responsive design on mobile/tablet/desktop
   # - Verify all user flows work correctly
   # - Test error scenarios and edge cases
   # - Check browser console for errors/warnings
   ```

4. **Submit Pull Request with Quality Assessment:**
   - Provide clear description of changes and motivation
   - Reference related issues using #123 syntax
   - Include screenshots for UI changes
   - List any breaking changes or migration steps
   - Complete the PR quality checklist
   - Update documentation if needed

### **Enhanced PR Template**

```markdown
## 🎯 Description

Brief description of changes and why they were needed

## 📋 Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (code improvement without functional changes)
- [ ] 🚨 Breaking change (fix or feature causing existing functionality to change)

## 🧪 Testing Completed

- [ ] ✅ Unit tests pass (`pnpm test`)
- [ ] ✅ Build succeeds (`pnpm run build`)
- [ ] ✅ Type checking passes (`pnpm run type-check`)
- [ ] ✅ Linting passes (`pnpm run lint`)
- [ ] ✅ Manual testing completed in browser
- [ ] ✅ Responsive design verified (mobile/tablet/desktop)
- [ ] ✅ Prisma client generates successfully (if database changes)

## 🔒 Security Checklist

- [ ] ✅ No hardcoded secrets or credentials
- [ ] ✅ Input validation added for new endpoints/forms
- [ ] ✅ Authentication/authorization properly implemented
- [ ] ✅ Error handling doesn't expose sensitive information

## 📊 Performance Impact

- [ ] ✅ No significant performance regressions
- [ ] ✅ React components properly memoized where needed
- [ ] ✅ Database queries optimized
- [ ] ✅ Bundle size impact considered

## 📷 Screenshots (if applicable)

[Add screenshots for UI changes]

## 🔗 Related Issues

Closes #123
Related to #456

## 📝 Additional Notes

[Any additional context, migration steps, or deployment considerations]
```

## 🧪 **Testing Standards**

### **Centralized Test Architecture**

**All tests are organized in the `/tests/` directory for better structure:**

```bash
tests/
├── frontend/
│   ├── unit/                  # Component & logic tests
│   ├── e2e/                   # End-to-end user journey tests
│   └── test-setup.ts          # Centralized test configuration
├── backend/
│   ├── unit/                  # API & service tests
│   └── integration/           # Database & external API tests
├── installer/                 # Installer testing framework
└── run-tests-simple.sh        # Complete test runner
```

### **Running Tests**

**Centralized Test Runner (Recommended):**

```bash
# Run all available tests
./tests/run-tests-simple.sh

# See what tests would run (dry-run)
./tests/run-tests-simple.sh --dry-run

# Advanced test runner with options
./tests/run-all-tests.sh --frontend-only
./tests/run-all-tests.sh --installer-only
```

**Individual Test Suites:**

```bash
# Backend unit tests
cd backend && pnpm test

# Backend tests with coverage report
cd backend && pnpm run test:cov

# Frontend tests (points to centralized tests)
cd frontend && pnpm test

# Frontend tests with coverage
cd frontend && pnpm run test:coverage

# Watch mode for development
pnpm run test:watch

# E2E tests (centralized location)
cd frontend && pnpm run test:e2e
```

### **Test Organization Benefits**

- **Single Source of Truth**: All tests in `/tests/` directory
- **Professional Structure**: Clear separation by type and purpose
- **Easy Discovery**: Simple structure for finding specific tests
- **Consistent Setup**: Shared configuration and utilities
- **Comprehensive Coverage**: 52+ test cases across 7 categories

### **Writing Tests**

#### **Backend Testing with Prisma:**

```typescript
// Example: Service test with proper mocking
describe("PortfolioService", () => {
  let service: PortfolioService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: {
            portfolio: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should create portfolio with proper validation", async () => {
    const createData = {
      userId: "user-123",
      name: "Test Portfolio",
      currency: "GBP",
    };

    const expectedResult = {
      id: "portfolio-123",
      ...createData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(prisma.portfolio, "create").mockResolvedValue(expectedResult);

    const result = await service.createPortfolio(createData);

    expect(result).toEqual(expectedResult);
    expect(prisma.portfolio.create).toHaveBeenCalledWith({
      data: createData,
    });
  });
});
```

#### **Frontend Testing with React Testing Library:**

```typescript
// Example: Component test with user interactions
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PortfolioCard } from "./PortfolioCard";

const mockPortfolio = {
  id: "1",
  name: "Test Portfolio",
  currency: "GBP",
  totalValue: 10000,
  performance: 5.2,
};

test("renders portfolio information correctly", () => {
  render(<PortfolioCard portfolio={mockPortfolio} />);

  expect(screen.getByText("Test Portfolio")).toBeInTheDocument();
  expect(screen.getByText("£10,000")).toBeInTheDocument();
  expect(screen.getByText("+5.2%")).toBeInTheDocument();
});

test("calls onUpdate when edit button is clicked", async () => {
  const mockOnUpdate = jest.fn();
  render(<PortfolioCard portfolio={mockPortfolio} onUpdate={mockOnUpdate} />);

  const editButton = screen.getByRole("button", { name: /edit/i });
  fireEvent.click(editButton);

  await waitFor(() => {
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
      })
    );
  });
});
```

### **Manual Testing Checklist**

Before submitting any PR, ensure you've tested:

- [ ] **Basic functionality** - All affected features work correctly
- [ ] **Responsive design** - Mobile (375px), tablet (768px), desktop (1024px+)
- [ ] **Browser compatibility** - Chrome, Firefox, Safari, Edge
- [ ] **Different user scenarios** - New users, existing users, different permissions
- [ ] **Error handling** - Network failures, invalid inputs, edge cases
- [ ] **Performance** - Page load times, smooth interactions, no memory leaks
- [ ] **Accessibility** - Keyboard navigation, screen reader compatibility

## 📖 **Documentation Standards**

### **Code Documentation**

- **Add JSDoc comments** for all public APIs and complex functions
- **Update README files** for new features or changed workflows
- **Include inline comments** for complex business logic
- **Document environment variables** in .env.example files
- **Update API documentation** for new endpoints

### **User Documentation**

All user-facing documentation is organized in the `docs/` directory:

- **Setup guides** in `docs/setup/` - Installation and configuration
- **Feature documentation** in `docs/features/` - Technical specifications
- **Process guides** in `docs/processes/` - Development workflows
- **Development docs** in `docs/development/` - Technical implementation

When adding new features:

1. **Update relevant setup guides** if installation process changes
2. **Create feature documentation** for complex new functionality
3. **Update the main README** if core functionality changes
4. **Include screenshots** for UI changes
5. **Add migration notes** if changes affect existing installations

## 🏗️ **Updated Project Structure**

```
profolio/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── app/               # Feature modules (auth, portfolio, market-data)
│   │   ├── config/            # Configuration and environment handling
│   │   ├── common/            # Shared utilities, decorators, guards
│   │   ├── database/          # Database configuration and migrations
│   │   └── prisma/            # Prisma schema and generated client
│   ├── test/                  # Test files and utilities
│   ├── package.json           # Backend dependencies (uses pnpm)
│   └── tsconfig.json          # TypeScript configuration
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/               # App router pages and layouts
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Utility functions and API clients
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies (uses pnpm)
│   └── next.config.js         # Next.js configuration
├── docs/                       # Organized documentation
│   ├── setup/                 # Installation and setup guides
│   ├── development/           # Development documentation
│   ├── processes/             # Development workflows and standards
│   ├── features/              # Feature specifications
│   ├── fixes/                 # Historical bug fixes
│   ├── releases/              # Release notes and changelogs
│   ├── testing/               # Testing guides and documentation
│   └── maintenance/           # Quality assurance and maintenance
├── tests/                      # Centralized testing directory
│   ├── frontend/              # Frontend tests (unit, E2E)
│   ├── backend/               # Backend tests (unit, integration)
│   ├── installer/             # Installer testing framework
│   └── run-tests-simple.sh   # Complete test runner
├── scripts/                    # Build and deployment scripts
├── install/                    # Modular installer system
│   ├── bootstrap.sh           # Auto-downloads modular components
│   ├── module-loader.sh       # Loads and validates modules
│   ├── platforms/             # Platform-specific installers
│   ├── features/              # Feature modules (SSH, optimization)
│   ├── core/                  # Core functionality (rollback, version control)
│   └── utils/                 # Shared utilities (logging, validation)
├── install.sh                 # Main installer entry point
├── install-proxmox.sh         # Proxmox-specific installer
├── package.json               # Root package configuration (packageManager: pnpm)
├── pnpm-lock.yaml             # pnpm lock file (NEVER package-lock.json)
├── CONTRIBUTING.md            # This file - contribution guidelines
├── SECURITY.md                # Security policies and reporting
├── LICENSE                    # MIT license
└── README.md                  # Project overview and quick start
```

## 🔐 **Security & Quality Standards**

### **Security Guidelines**

We follow enterprise-grade security standards:

- **Never commit secrets** - Use environment variables for all configuration
- **Validate all inputs** - Both client and server-side validation required
- **Follow OWASP guidelines** - SQL injection, XSS, CSRF protection
- **Use HTTPS in production** - TLS 1.3 minimum
- **Implement proper authentication** - JWT with secure session management
- **Follow the principle of least privilege** - Minimal required permissions

### **Mandatory Security Checklist**

Before any commit:

- [ ] **No hardcoded secrets** - Check with `git grep -E "(password|secret|key|token)"`
- [ ] **Input validation** added for all new user inputs
- [ ] **Authentication checks** in place for protected routes
- [ ] **Error handling** doesn't expose sensitive information
- [ ] **Dependencies scanned** - Run `pnpm audit` and address issues
- [ ] **HTTPS enforced** for all external API calls

### **Code Quality Requirements**

Use our [Code Quality Checklist](docs/processes/CODE_QUALITY_CHECKLIST.md):

- **TypeScript strict mode** - No `any` types without justification
- **ESLint compliance** - All rules must pass
- **Performance optimization** - React memoization, efficient queries
- **pnpm consistency** - All package operations use pnpm
- **Build verification** - `pnpm run build` must succeed
- **Test coverage** - Minimum 80% for new features

### **Reporting Security Issues**

Please report security vulnerabilities **privately**:

- Use GitHub's **private vulnerability reporting** feature
- Include detailed description and reproduction steps
- We'll respond within 24 hours
- See our [Security Policy](SECURITY.md) for full process

## 📋 **Code Review Process**

### **Review Criteria**

All contributions are reviewed for:

- **Code quality** and adherence to established patterns
- **Security considerations** and potential vulnerabilities
- **Performance implications** and optimization opportunities
- **Test coverage** and quality of test cases
- **Documentation completeness** and accuracy
- **pnpm compliance** and package management standards

### **Review Timeline**

- **Simple fixes** (documentation, typos): 1-2 days
- **Bug fixes**: 2-4 days
- **New features**: 3-7 days
- **Major changes**: 1-2 weeks

### **Review Guidelines for Contributors**

- **Be constructive and respectful** in all interactions
- **Explain the reasoning** behind suggestions
- **Test changes locally** when possible
- **Approve when ready** even if minor improvements are possible
- **Focus on impact** rather than personal preferences

## 🏷️ **Issue Labels & Project Management**

We use these labels to organize issues and pull requests:

- **`bug`** - Something isn't working correctly
- **`feature`** - New feature or enhancement request
- **`documentation`** - Documentation improvements needed
- **`good first issue`** - Good for newcomers to the project
- **`help wanted`** - Extra attention or expertise needed
- **`security`** - Security-related issues (handle privately)
- **`enhancement`** - Improvement to existing feature
- **`pnpm`** - Package manager related changes
- **`prisma`** - Database/ORM related changes
- **`performance`** - Performance optimization opportunities

## 🌟 **Recognition & Community**

### **Contributor Recognition**

Contributors are recognized through:

- **Listing in project contributors** section
- **Credits in release notes** for significant contributions
- **Input on project direction** and feature planning
- **Early access** to new features and beta releases
- **Community highlights** in project updates

### **Growing Our Community**

Help us build a strong community by:

- **Participating in discussions** and helping other users
- **Sharing your experience** with Profolio implementations
- **Contributing to documentation** and guides
- **Reporting bugs** and suggesting improvements
- **Spreading the word** about self-hosted portfolio management

## ❓ **Getting Help**

### **Development Questions**

- **[GitHub Discussions](https://github.com/Obednal97/profolio/discussions)** - Development questions and community help
- **[GitHub Issues](https://github.com/Obednal97/profolio/issues)** - Bug reports and feature requests
- **[Documentation](docs/)** - Comprehensive guides and technical documentation

### **Common Development Issues**

#### **pnpm Related Issues:**

```bash
# Clear pnpm cache if having dependency issues
pnpm store prune

# Verify pnpm version
pnpm --version  # Should be 9.14.4+

# If npm lock file conflicts
rm package-lock.json  # Only keep pnpm-lock.yaml
```

#### **Database Issues:**

```bash
# Regenerate Prisma client after schema changes
pnpm prisma generate

# Reset database in development
pnpm prisma migrate reset

# Check database connection
pnpm prisma db pull
```

#### **Build and Development Issues:**

- **Port conflicts** - Change ports in .env files (backend: 3001, frontend: 3000)
- **TypeScript errors** - Run `pnpm run type-check` for detailed diagnostics
- **Build failures** - Check for missing dependencies with `pnpm install`
- **Hot reload issues** - Restart development servers and clear browser cache

## 📝 **License Agreement**

By contributing to Profolio, you agree that your contributions will be licensed under the **MIT License**. This ensures that:

- **Your contributions remain open source** and benefit the entire community
- **Users maintain freedom** to use, modify, and distribute the software
- **Commercial use is permitted** while maintaining attribution
- **No warranty obligations** are placed on contributors

---

**Thank you for contributing to Profolio! Together, we're building the most comprehensive self-hosted portfolio management platform. Your contributions help thousands of users maintain control over their financial data with complete privacy and sovereignty.** 🚀
