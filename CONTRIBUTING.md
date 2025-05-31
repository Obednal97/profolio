# 🤝 Contributing to Profolio

Thank you for your interest in contributing to Profolio! We welcome contributions from everyone, whether you're fixing bugs, adding features, improving documentation, or spreading the word.

## 📋 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm 8+
- Git knowledge
- TypeScript familiarity (helpful)
- PostgreSQL (optional for development - can use mock data)
- Docker (optional for database development)

## 🏗️ **Development Setup**

### **Quick Start (5 minutes)**
```bash
# 1. Fork and clone repository
git clone https://github.com/YOUR_USERNAME/profolio.git
cd profolio

# 2. Install dependencies for both backend and frontend
cd backend && npm install
cd ../frontend && npm install

# 3. Setup environment files
# Backend .env (development)
echo 'DATABASE_URL="postgresql://profolio:dev123@localhost:5432/profolio_dev"
JWT_SECRET="dev-jwt-secret-change-in-production"
API_ENCRYPTION_KEY="dev-encryption-key-change-in-production"
NODE_ENV=development
PORT=3001' > backend/.env

# Frontend .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development' > frontend/.env.local

# 4. Start development servers
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# 5. Open browser
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
cd backend && npx prisma migrate dev
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

# Run migrations
cd backend && npx prisma migrate dev
```

### **Development Workflow**

#### **Day-to-Day Development:**
1. **Work Locally** - Make changes on your local machine
2. **Test Locally** - Verify everything works with development servers
3. **Create Feature Branch** - `git checkout -b feature/my-feature`
4. **Make Changes** - Follow code guidelines below
5. **Test Changes** - Run tests and manual testing
6. **Push to GitHub** - `git push origin feature/my-feature`
7. **Create Pull Request** - Review changes before merging

#### **Useful Development Commands**
```bash
# Start development with hot reload
npm run dev:backend    # Backend with hot reload
npm run dev:frontend   # Frontend with hot reload

# Database operations
npx prisma studio      # Visual database browser
npx prisma migrate dev # Run new migrations
npx prisma generate    # Regenerate Prisma client

# Code quality
npm run lint           # Check code style
npm run format         # Format code
npm test              # Run tests
```

### **Development Tools**

#### **Required:**
```bash
node --version  # v18+ required
npm --version   # v8+ required
git --version   # v2.30+ recommended
```

#### **Recommended:**
- **VS Code** - With TypeScript and Prisma extensions
- **Postman** - For API testing
- **Docker** - For database development
- **Git GUI** - GitHub Desktop, GitKraken, or VS Code Git

#### **Helpful VS Code Extensions:**
- TypeScript and JavaScript Language Features
- Prisma (for database schema)
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag

## 🐛 **Reporting Issues**

### **Bug Reports**
Please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Node.js version)
- Screenshots if applicable
- Error messages from console/logs

### **Feature Requests**
Please include:
- Clear description of the proposed feature
- Use case and motivation
- Any relevant mockups or examples
- Implementation suggestions (if any)

## 🔧 **Making Changes**

### **Code Guidelines**

#### **General:**
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add proper type definitions
- Include JSDoc comments for public APIs
- Write self-documenting code with clear variable names

#### **Backend (NestJS):**
```typescript
// Example: Proper service structure
@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user portfolio with positions
   * @param userId - User identifier
   * @returns Portfolio with positions
   */
  async getPortfolio(userId: string): Promise<Portfolio> {
    // Implementation
  }
}
```

- Follow NestJS conventions and decorators
- Use Prisma for all database operations
- Add proper error handling with HTTP exceptions
- Include unit tests for new services
- Use dependency injection properly

#### **Frontend (Next.js):**
```typescript
// Example: Proper component structure
interface PortfolioCardProps {
  portfolio: Portfolio;
  onUpdate?: (portfolio: Portfolio) => void;
}

export function PortfolioCard({ portfolio, onUpdate }: PortfolioCardProps) {
  // Implementation using hooks
}
```

- Use functional components with hooks
- Follow React best practices and patterns
- Use Tailwind CSS for styling
- Ensure responsive design (mobile-first)
- Add proper TypeScript interfaces
- Handle loading and error states

#### **Database (Prisma):**
```prisma
// Example: Proper model structure
model Portfolio {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User       @relation(fields: [userId], references: [id])
  positions Position[]
  
  @@map("portfolios")
}
```

- Use descriptive model and field names
- Add proper relations and constraints
- Include created/updated timestamps
- Use appropriate field types

### **Commit Messages**
Use [Conventional Commits](https://www.conventionalcommits.org/) format:
```
feat: add portfolio performance analytics dashboard
fix: resolve API key encryption issue in demo mode
docs: update installation guide with Proxmox setup
test: add unit tests for authentication service
refactor: improve error handling in API client
style: format code with prettier
```

### **Pull Request Process**

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   # or  
   git checkout -b docs/documentation-update
   ```

2. **Make Changes:**
   - Write clean, well-documented code
   - Add tests if applicable
   - Update documentation
   - Follow code guidelines above

3. **Test Your Changes:**
   ```bash
   # Backend tests
   cd backend && npm test

   # Frontend tests  
   cd frontend && npm test

   # Lint and format
   npm run lint
   npm run format

   # Manual testing
   # Test in development environment
   # Check responsive design
   # Verify all features work
   ```

4. **Submit Pull Request:**
   - Provide clear description of changes
   - Reference related issues (#123)
   - Include screenshots for UI changes
   - List any breaking changes
   - Update documentation if needed

### **PR Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Responsive design verified

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🧪 **Testing**

### **Running Tests**
```bash
# Backend unit tests
cd backend && npm test

# Backend tests with coverage
cd backend && npm run test:cov

# Frontend tests
cd frontend && npm test

# Frontend tests with coverage
cd frontend && npm run test:coverage

# Watch mode for development
npm run test:watch
```

### **Writing Tests**

#### **Backend Testing:**
```typescript
// Example: Service test
describe('PortfolioService', () => {
  let service: PortfolioService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PortfolioService, PrismaService],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  it('should create portfolio', async () => {
    // Test implementation
  });
});
```

#### **Frontend Testing:**
```typescript
// Example: Component test
import { render, screen } from '@testing-library/react';
import { PortfolioCard } from './PortfolioCard';

test('renders portfolio name', () => {
  const portfolio = { id: '1', name: 'Test Portfolio' };
  render(<PortfolioCard portfolio={portfolio} />);
  
  expect(screen.getByText('Test Portfolio')).toBeInTheDocument();
});
```

### **Manual Testing Checklist**
- [ ] All affected functionality works
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Different user roles/permissions
- [ ] Error handling and edge cases
- [ ] Performance (page load times)

## 📖 **Documentation**

### **Code Documentation**
- Add JSDoc comments for public APIs
- Update README files for new features
- Include inline comments for complex logic
- Document environment variables
- Update API documentation

### **User Documentation**
- Update relevant guide files in `docs/`
- Add new setup instructions if needed
- Include screenshots for UI changes
- Update the main README.md if needed

## 🏗️ **Project Structure**

```
profolio/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── app/         # Feature modules (auth, portfolio, etc.)
│   │   ├── config/      # Configuration files
│   │   ├── common/      # Shared utilities and decorators
│   │   └── prisma/      # Database schema and migrations
├── frontend/             # Next.js application  
│   ├── src/
│   │   ├── app/         # App router pages
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # Utility functions and API clients
│   │   └── hooks/       # Custom React hooks
├── docs/                 # Organized documentation
│   ├── features/        # Feature-specific guides
│   └── deployment/      # Deployment guides
├── policies/            # Legal compliance documents
├── scripts/             # Utility scripts
├── install-or-update.sh # Main installer script
└── www/                 # Landing page and assets
```

## 🔐 **Security**

### **Security Guidelines**
- Never commit API keys, passwords, or secrets
- Use environment variables for all configuration
- Validate and sanitize all user inputs
- Follow OWASP security guidelines
- Use HTTPS in production
- Implement proper authentication and authorization

### **Security Checklist**
- [ ] No hardcoded secrets in code
- [ ] Input validation on all endpoints
- [ ] Proper error handling (no sensitive info in errors)
- [ ] Authentication required for protected routes
- [ ] SQL injection prevention (using Prisma)
- [ ] XSS prevention in frontend

### **Reporting Security Issues**
Please report security vulnerabilities privately:
- Create a **private** GitHub issue
- Email: [Open an issue for contact info]
- Include detailed description and steps to reproduce
- We'll respond within 48 hours

## 📋 **Code Review Process**

### **Review Criteria**
- Code quality and readability
- Adherence to project patterns and conventions
- Security considerations
- Performance implications
- Test coverage and quality
- Documentation completeness

### **Review Timeline**
- Simple fixes (documentation, typos): 1-2 days
- Bug fixes: 2-4 days  
- New features: 3-7 days
- Major changes: 1-2 weeks

### **Review Guidelines**
- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve when ready, even if minor improvements possible
- Test the changes if possible

## 🏷️ **Issue Labels**

We use these labels to organize issues:
- `bug`: Something isn't working correctly
- `feature`: New feature or enhancement request
- `documentation`: Documentation improvements needed
- `good first issue`: Good for newcomers to the project
- `help wanted`: Extra attention or expertise needed
- `security`: Security-related issues (handle privately)
- `enhancement`: Improvement to existing feature
- `question`: Question about usage or implementation

## 🌟 **Recognition**

Contributors will be:
- Listed in the project's contributor section
- Credited in release notes for significant contributions
- Invited to provide input on project direction
- Mentioned in community updates

## ❓ **Getting Help**

### **Development Questions:**
- **GitHub Discussions:** Ask questions about development
- **Issues:** Report bugs or request features  
- **Documentation:** Check existing guides first

### **Common Issues:**
- **Port conflicts:** Change ports in .env files
- **Database connection:** Check PostgreSQL is running
- **NPM issues:** Clear node_modules and reinstall
- **TypeScript errors:** Run `npx tsc --noEmit` to check

## 📝 **License**

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 **Thank You!**

Every contribution helps make Profolio better for the self-hosted community. Whether you're fixing typos, adding features, or reporting bugs, your help is appreciated!

**Happy Contributing! 🚀** 