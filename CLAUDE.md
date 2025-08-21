# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint errors
npm run type-check   # TypeScript compilation check

# Database Setup
npm run setup-demo   # Create demo accounts and sample data
```

## Demo Accounts

After running `npm run setup-demo`, you can test with:
- **👑 Admin**: admin@fitness.com / password123
- **💪 Trainer**: trainer@fitness.com / password123

## Demo Members

Demo members are created as managed data records (no authentication):
- **🏃 John Doe** - john.doe@email.com (Active)
- **🏃 Emily Smith** - emily.smith@email.com (Active)  
- **🏃 Mike Johnson** - mike.johnson@email.com (Frozen)

## ✨ Modern Architecture Overview (2024-2025)

This fitness studio CRM is built with **Next.js 15 App Router**, **React 19**, and follows **2024-2025 best practices** for modern web application development. The application features a comprehensive modernization with TanStack Query, Server Components, React 19 compiler optimizations, and enhanced performance patterns.

### 🚀 Core Tech Stack (Modernized)

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Supabase (auth, database, realtime)
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: 
  - **Server State**: TanStack Query v5 with smart caching
  - **Client State**: Zustand store for app-wide state
  - **Auth State**: React Context for authentication
- **Forms & Validation**: React Hook Form + Zod runtime validation
- **Performance**: React 19 compiler, Server Components, virtualization

### 🏗️ Modern Architecture Patterns

**✅ Server-First Architecture**:
- Server Components for static content and initial data loading
- Client Components only when interactivity is required
- Hybrid rendering for optimal performance

**✅ Modern State Management**:
- TanStack Query v5 for server state with intelligent caching
- Enhanced BaseService pattern with optimistic updates
- Automatic cache invalidation and query key management

**✅ Performance Optimizations**:
- React 19 experimental compiler for automatic memoization
- Virtualized lists for large datasets (react-window)
- Package import optimization and tree-shaking
- SWC compiler optimizations

### 🔒 Role-Based Architecture

The application has two authenticated user roles with separate portals:

1. **Admin Portal** (`/admin/*`) - Full system access, member management, analytics, trainer oversight
2. **Trainer Portal** (`/trainer/*`) - Client management, session scheduling, progress tracking
3. **Members** - Non-authenticated data records managed by admins and accessible to trainers

### 🔐 Authentication Flow

Authentication is handled through `src/lib/auth/auth-context.tsx`:
- Supabase Auth integration with role-based redirects (admin/trainer only)
- `useAuth()` hook provides user state and role helpers (`isAdmin`, `isTrainer`)
- `ProtectedRoute` component wraps pages requiring specific roles
- Home page (`/`) automatically redirects to role-appropriate dashboard

### 📊 Enhanced Data Layer Architecture

**Types**: All fitness domain models are defined in `src/types/index.ts`:
- `User` (authenticated admin/trainer), `Member` (standalone record), `Trainer` (extends User)
- `Subscription`, `Payment`, `TrainingSession`, `BodyMeasurement`, `Attendance`

**Modern State Management**:
- **Server State**: TanStack Query v5 with enhanced BaseService pattern
- **Validation**: Comprehensive Zod schemas for runtime type safety
- **Caching**: Smart query invalidation and optimistic updates
- **Performance**: Automatic memoization through React 19 compiler

**Database**: Supabase PostgreSQL with the following key tables:
- `users` (extends auth.users with admin/trainer profile data)
- `members` (standalone customer records), `trainers` (authenticated user extensions)
- `subscriptions`, `payments`, `training_sessions`
- `body_measurements`, `attendance`

### 🎨 Component Architecture (Modernized)

**Server Components** (`src/components/dashboard/`):
- `AdminDashboardStats` - Server-rendered statistics
- `AdminDashboardActivities` - Server-rendered activity feed
- Static content components for better performance

**Client Components**:
- Interactive UI components requiring hooks or event handlers
- Form components with React Hook Form integration
- Real-time data components

**Optimized Components** (`src/components/optimized/`):
- `MemberListItem` - Memoized list item for performance
- `VirtualMemberList` - Virtualized lists for large datasets
- Performance-critical components with React.memo

### 🛠️ Modern Service Layer Pattern

**Enhanced BaseService** (`src/lib/services/base-service.ts`):
```typescript
class BaseService {
  // Modern patterns implemented:
  // - Optimistic updates with automatic rollback
  // - Smart cache invalidation
  // - Zod validation integration
  // - Error handling with ServiceResponse pattern
  // - Query key factories for consistent caching
}
```

**Service Pattern Requirements**:
- All database operations MUST go through service layer
- MUST use Zod validation for input/output
- MUST implement proper error handling
- MUST use TanStack Query for cache management
- MUST follow ServiceResponse<T> pattern

### 🎯 Modern Development Patterns (MANDATORY)

1. **Server Components First**: Use Server Components unless interactivity is required
2. **TanStack Query**: Use modern hooks pattern, not useState/useEffect for server data
3. **Zod Validation**: All API inputs/outputs MUST be validated with Zod
4. **Enhanced BaseService**: All new services MUST extend BaseService
5. **Type Safety**: Strict TypeScript with proper interface definitions
6. **Performance**: Use React.memo, virtualization for large lists
7. **Cache Management**: Implement proper query invalidation strategies

### 📋 Code Quality Standards (CRITICAL)

**Before any commit**:
1. ✅ Run `npm run lint` to check code quality
2. ✅ Run `npm run type-check` to verify TypeScript
3. ✅ Test with demo accounts to ensure functionality
4. ✅ Verify hover states and visual consistency work properly
5. ✅ Ensure all new code follows modern patterns outlined below

**Modern Code Patterns (MANDATORY)**:
```typescript
// ✅ CORRECT: Modern TanStack Query Hook
export function useMembers(filters?: MemberFilters) {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: () => memberService.getMembers(filters),
    select: (data) => data.data || [],
    meta: { errorMessage: 'Failed to load members' }
  });
}

// ❌ INCORRECT: Old useState/useEffect Pattern
const [members, setMembers] = useState([]);
useEffect(() => {
  memberService.getMembers().then(setMembers);
}, []);

// ✅ CORRECT: Enhanced Service with Validation
async createMember(data: CreateMemberData): Promise<ServiceResponse<Member>> {
  const validation = this.validateInput(CreateMemberSchema, data);
  if (validation.error) return { data: null, error: validation.error };
  
  return this.executeMutation(/* ... */, {
    invalidateQueries: [this.invalidate.members.all],
    optimisticUpdate: { queryKey, updater }
  });
}

// ✅ CORRECT: Server Component for Static Content
export async function AdminDashboardStats() {
  // Server-side data fetching
  return <div>{/* Static content */}</div>;
}

// ✅ CORRECT: Memoized Performance Component
export const MemberListItem = memo(function MemberListItem({
  member, onEdit, onDelete
}: MemberListItemProps) {
  // Memoized component logic
});
```

### 🔧 Environment Configuration

Critical environment variables (copy from `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 🎨 UI Theme and Colors - Mono Theme Implementation ✅

The application uses a **professional monochrome theme** with **Geist Mono** typography:

**Monochrome Color Palette** (defined in `src/app/globals.css`):
- **Primary**: `oklch(0.2 0 0)` - Dark charcoal for primary elements in light mode
- **Background**: `oklch(0.98 0 0)` (light) / `oklch(0.08 0 0)` (dark)
- **Foreground**: `oklch(0.15 0 0)` (light) / `oklch(0.95 0 0)` (dark)
- **Chart Colors**: Graduated grayscale palette from dark to light for data visualization

**Theme Features**:
- **Light/Dark Mode Toggle**: Seamless switching with localStorage persistence
- **Monospace Typography**: Geist_Mono for consistent, professional appearance
- **Accessible Contrast**: Carefully balanced grayscale colors for optimal readability
- **Consistent Theming**: All components, charts, and status indicators use the monochrome palette

**Theme Implementation**:
- **Theme Context**: `src/lib/theme/theme-context.tsx` - System preference detection and persistence
- **Theme Toggle**: `src/components/ui/theme-toggle.tsx` - Sun/moon icon toggle button
- **Color Variables**: All colors defined using OKLCH color space for modern color consistency
- **Chart Colors**: Dynamic theme-aware colors in member distribution charts and status breakdowns

## ✅ Comprehensive Modernization Complete

### Phase 1: Modern State Management ✅
- **TanStack Query v5**: Intelligent caching with 5min stale time, 10min garbage collection
- **Enhanced BaseService**: Modern service architecture with optimistic updates
- **Zod Validation**: Comprehensive runtime validation for all data models
- **Modern Hooks**: Replaced useState/useEffect with TanStack Query patterns

### Phase 2: Server Component Optimization ✅
- **Server Components**: Static dashboard components for better performance
- **Hybrid Architecture**: Server Components for static content, Client Components for interactivity
- **Metadata Optimization**: Proper SEO metadata for all page components
- **Performance Separation**: Clear distinction between static and interactive content

### Phase 3: React 19 Compiler & Performance ✅
- **React 19 Compiler**: Automatic memoization and performance optimizations
- **Package Optimization**: Tree-shaking and bundle size reduction
- **Virtualization**: Large dataset handling with react-window
- **Build Optimizations**: SWC compilation, compression, production optimizations

### 🏆 Features Implemented

**✅ Member Management System - COMPLETE**
- Member CRUD operations with modern TanStack Query patterns
- Advanced filtering, search, and pagination
- Member detail view with comprehensive profile management
- Subscription management with real-time updates
- CSV export functionality
- All operations use enhanced BaseService with proper validation

**✅ Training Session Management System - COMPLETE**
- Calendar interface with session scheduling and conflict detection
- Session creation/editing with comprehensive form validation
- Session status management and progress tracking
- Comments system with categorized notes
- Real-time conflict detection and availability checking
- Trainer management and availability scheduling

**✅ Calendar Enhancement - COMPLETE**
- Modern UI with optimized time slots (9AM-9PM, 30-min intervals)
- Enhanced event display with participant information
- Consistent primary color theming throughout
- Responsive design with proper modal sizing
- Pixel-perfect alignment and professional styling

**✅ Subscription Plans Management System - COMPLETE**
- Admin-only subscription plan creation, editing, and management
- Comprehensive CRUD operations with modern TanStack Query patterns
- Advanced filtering by duration, status, and search functionality
- Real-time statistics dashboard with revenue breakdown
- Plan activation/deactivation with optimistic updates
- Feature management with dynamic tags and validation
- Form validation with Zod schemas and error handling
- Proper database field mapping and hydration handling
- Professional UI with card-based layout and responsive design

**✅ Monochrome Theme System - COMPLETE**
- Professional monochrome design with Geist_Mono typography
- Light/dark mode toggle with system preference detection and localStorage persistence
- OKLCH color space implementation for modern, consistent color definitions
- Theme-aware component styling throughout the application
- Monochromatic chart colors with proper contrast and accessibility
- Dynamic status color system that adapts to light/dark themes
- Comprehensive theme context with React Context API
- Optimized color visibility for data visualization and status indicators

## 🚨 Critical Implementation Rules

**NEVER implement new features without following these patterns:**

1. **Service Layer**: All new services MUST extend BaseService
2. **Validation**: All inputs/outputs MUST use Zod validation
3. **State Management**: Use TanStack Query hooks, NEVER useState for server data
4. **Performance**: Use Server Components for static content
5. **Optimization**: Implement React.memo for performance-critical components
6. **Caching**: Proper query invalidation and cache management
7. **Error Handling**: Use ServiceResponse<T> pattern consistently

**Before implementing ANY new feature**:
1. ✅ Check existing patterns in BaseService and modern hooks
2. ✅ Create Zod validation schemas first
3. ✅ Implement service layer with proper error handling
4. ✅ Use TanStack Query hooks for state management
5. ✅ Consider Server vs Client Component architecture
6. ✅ Implement proper cache invalidation strategy
7. ✅ Add performance optimizations where needed

## 🎯 Next Development Priorities

The application is now fully modernized with 2024-2025 best practices. Current completed features include comprehensive member management, training sessions, calendar functionality, and subscription plans management. Future features should:

- **Payment Processing**: Stripe integration with subscription plans
- **Progress Tracking**: Body measurements with TanStack Query optimization  
- **Attendance System**: Real-time check-in/out with Server Components
- **Analytics Dashboard**: Performance-optimized charts and metrics
- **Real-time Features**: Supabase realtime with modern state management
- **Member Portal**: Self-service subscription management for customers

**Remember**: Always follow the established modern patterns. The architecture is now optimized for performance, maintainability, and scalability using cutting-edge React and Next.js techniques.

## 🌐 Professional Development & GitHub Integration

### 📝 Git Workflow & Collaboration Standards

**Branch Naming Convention**:
```
feature/add-member-analytics
fix/subscription-payment-bug
hotfix/critical-session-booking-issue
chore/update-dependencies
docs/update-api-documentation
```

**Commit Message Standards** (Conventional Commits):
```
feat: add member analytics dashboard with real-time metrics
fix: resolve subscription payment processing timeout
chore: update TanStack Query to v5.85.4
docs: add deployment guide for production environments
test: add unit tests for session booking validation
refactor: optimize member query performance with indexing
```

**Pull Request Requirements**:
- Descriptive title following conventional commit format
- Clear description of changes and motivation
- Screenshots for UI changes
- Checklist of testing completed
- Link to related issues or tickets
- Code review from at least 1 team member
- All CI/CD checks must pass

### 🔍 Code Review Standards

**Before Creating PR**:
1. ✅ Run all quality checks locally: `npm run lint && npm run type-check && npm run build`
2. ✅ Test with demo accounts to ensure functionality works
3. ✅ Verify responsive design on multiple screen sizes
4. ✅ Check console for errors or warnings
5. ✅ Ensure proper error handling and loading states

**Code Review Checklist**:
- [ ] Code follows established patterns (BaseService, TanStack Query, Zod validation)
- [ ] No security vulnerabilities introduced
- [ ] Performance considerations addressed
- [ ] Proper error handling implemented
- [ ] Type safety maintained throughout
- [ ] Accessibility standards met
- [ ] Mobile responsiveness verified
- [ ] No breaking changes without migration plan

### 🚀 Production Deployment Rules

**Environment Promotion Flow**:
```
feature/branch → develop → staging → main → production
```

**Production Deployment Checklist**:
1. ✅ All tests passing in staging environment
2. ✅ Performance metrics within acceptable ranges
3. ✅ Security scan completed without critical issues
4. ✅ Database migration tested and validated
5. ✅ Rollback plan documented and tested
6. ✅ Monitoring and alerting configured
7. ✅ Team notification and deployment window scheduled

**Post-Deployment Verification**:
- Health check endpoints responding correctly
- Core user flows tested in production
- Error rates within normal thresholds
- Performance metrics stable

### 📊 Quality Gates & CI/CD

**Required Status Checks** (must pass before merge):
```yaml
- Code Quality (ESLint, Prettier)
- Type Safety (TypeScript compilation)  
- Security Audit (npm audit)
- Build Process (production build success)
- Unit Tests (when implemented)
- E2E Tests (critical user flows)
```

**Automated Quality Enforcement**:
- ESLint with strict TypeScript rules
- Prettier code formatting
- Husky pre-commit hooks
- GitHub Actions CI/CD pipeline
- Automated dependency updates with Dependabot
- Security vulnerability scanning

### 🔐 Security & Best Practices

**Security Requirements**:
- Never commit secrets or API keys to repository
- Use environment variables for all configuration
- Implement proper input validation with Zod schemas
- Follow OWASP security guidelines
- Regular dependency updates for security patches
- Code scanning for vulnerabilities

**Development Best Practices**:
- Always create feature branches from latest develop
- Keep commits small and focused on single changes
- Write descriptive commit messages explaining the "why"
- Use TypeScript strictly - no `any` types allowed
- Implement proper error boundaries and fallback UI
- Follow accessibility guidelines (WCAG 2.1 AA)
- Optimize for Core Web Vitals performance metrics

### 📚 Documentation Standards

**Required Documentation**:
- Update CLAUDE.md for any architecture changes
- API documentation for new endpoints or services
- Component documentation for complex UI components
- Database schema changes documented
- Deployment and configuration updates

**Code Documentation**:
- JSDoc comments for complex functions and utilities
- README updates for significant feature additions
- Inline comments explaining business logic decisions
- Type definitions with descriptive property comments

### 🎯 Team Collaboration

**Issue Management**:
- Create GitHub issues for all bugs and feature requests
- Use issue templates for consistency
- Label issues appropriately (bug, enhancement, documentation)
- Link PRs to relevant issues
- Update issue status as work progresses

**Release Management**:
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Create release notes for each version
- Tag releases in Git with descriptive information
- Maintain changelog with user-facing changes
- Coordinate releases with stakeholders

**Knowledge Sharing**:
- Document architectural decisions and rationale
- Share learnings from complex implementations
- Regular code review sessions for knowledge transfer
- Maintain up-to-date development setup instructions

### 📋 Development Setup for New Team Members

**Required Tools**:
- Node.js 20+ with npm
- Git with configured SSH keys
- VSCode with recommended extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript Importer
  - Prettier - Code formatter
  - ESLint
- GitHub CLI for enhanced workflow

**First-time Setup**:
1. Clone repository and checkout develop branch
2. Copy `.env.example` to `.env.local` and configure
3. Run `npm install` to install dependencies
4. Run `npm run setup-demo` to create sample data
5. Start development server with `npm run dev`
6. Verify application loads and test with demo accounts

### 🚨 Emergency Procedures

**Hotfix Process**:
1. Create hotfix branch from main: `hotfix/critical-issue-description`
2. Implement minimal fix with proper testing
3. Create PR with detailed explanation and impact assessment
4. Get expedited review from senior team member
5. Deploy to staging for verification
6. Merge to main and deploy to production
7. Merge hotfix back to develop branch
8. Create post-incident review

**Rollback Procedures**:
1. Identify the specific deployment causing issues
2. Use platform rollback feature (Vercel/AWS)
3. Verify rollback success with health checks
4. Communicate status to team and stakeholders
5. Investigate root cause and plan proper fix
6. Document incident and lessons learned

This comprehensive development framework ensures professional, scalable, and maintainable code delivery while supporting effective team collaboration.