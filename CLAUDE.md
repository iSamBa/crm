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

## Architecture Overview

This is a fitness studio CRM built with Next.js 15 App Router, TypeScript, Supabase, and Tailwind CSS. The application uses a role-based architecture with two authenticated user portals and member data management.

### Core Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Supabase (auth, database, realtime)
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand store + TanStack Query for server state
- **Forms**: React Hook Form + Zod validation

### Role-Based Architecture

The application has two authenticated user roles with separate portals, plus member data management:

1. **Admin Portal** (`/admin/*`) - Full system access, member management, analytics, trainer oversight
2. **Trainer Portal** (`/trainer/*`) - Client management, session scheduling, progress tracking
3. **Members** - Non-authenticated data records managed by admins and accessible to trainers

### Authentication Flow

Authentication is handled through `src/lib/auth/auth-context.tsx`:
- Supabase Auth integration with role-based redirects (admin/trainer only)
- `useAuth()` hook provides user state and role helpers (`isAdmin`, `isTrainer`)
- `ProtectedRoute` component wraps pages requiring specific roles
- Home page (`/`) automatically redirects to role-appropriate dashboard

### Data Layer Architecture

**Types**: All fitness domain models are defined in `src/types/index.ts`:
- `User` (authenticated admin/trainer), `Member` (standalone record), `Trainer` (extends User)
- `Subscription`, `Payment`, `TrainingSession`, `BodyMeasurement`, `Attendance`

**State Management**:
- **Client State**: Zustand store (`src/store/index.ts`) for app-wide state
- **Server State**: TanStack Query for API data fetching and caching
- **Auth State**: Separate context for user authentication

**Database**: Supabase PostgreSQL with the following key tables:
- `users` (extends auth.users with admin/trainer profile data)
- `members` (standalone customer records), `trainers` (authenticated user extensions)
- `subscriptions`, `payments`, `training_sessions`
- `body_measurements`, `attendance`

### Layout System

Two layout components handle role-specific navigation:
- `AdminLayout` - Full sidebar with member management, trainer oversight, reports, analytics
- `TrainerLayout` - Client-focused navigation with scheduling and progress tracking tools

Both layouts use the `Sidebar` component with role-specific navigation items defined in:
- `adminNavItems`, `trainerNavItems`

### Environment Configuration

Critical environment variables (copy from `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Future integrations prepared:
- Stripe payment processing
- SMTP email configuration

### Constants and Routes

All application constants centralized in `src/constants/index.ts`:
- User roles, membership statuses, payment methods
- Route definitions for type-safe navigation
- Status enums for subscriptions, sessions, payments

### Component Architecture

**UI Components**: shadcn/ui base components in `src/components/ui/`
**Feature Components**: Organized by domain (members, trainers, payments, etc.)
**Layout Components**: Role-specific layouts and navigation

### Development Patterns

1. **File Naming**: Use kebab-case for files, PascalCase for components
2. **Route Organization**: Follow Next.js App Router conventions with role-based folders
3. **Type Safety**: Strict TypeScript with proper interface definitions
4. **Role Checks**: Always use `useAuth()` helpers for role-based logic
5. **Navigation**: Use `ROUTES` constants for type-safe routing

### Key Integration Points

- **Supabase Client**: `src/lib/supabase/client.ts` (client-side)
- **Supabase Server**: `src/lib/supabase/server.ts` (server-side with cookies)
- **Auth Context**: Global authentication state management
- **Query Provider**: TanStack Query setup in `src/lib/query-provider.tsx`

### Database Schema Reference

The README.md contains complete SQL schema for Supabase setup including:
- User role extensions, member/trainer specific tables
- Subscription and payment tracking
- Session scheduling and body measurement tracking
- Row Level Security (RLS) considerations

## UI Theme and Colors

The application uses a warm, energetic fitness-themed color palette:

**Primary Colors** (defined in `src/app/globals.css`):
- **Primary**: `oklch(0.65 0.22 28)` - Warm orange, used for main actions and active states
- **Accent**: `oklch(0.72 0.15 45)` - Lighter orange, for secondary elements
- **Secondary**: Standard grays for supporting elements

**Color Usage Guidelines**:
- Primary orange for active navigation, buttons, and key interactive elements
- White text (`primary-foreground`) for contrast against primary backgrounds
- Consistent hover states: `hover:bg-primary hover:text-primary-foreground`

**Interactive States**:
- Navigation links use primary color for active/hover states with white text
- Dashboard cards implement group hover pattern with icon color transitions
- All interactive elements follow the primary color scheme for consistency

## Recent Changes & Fixes

### Authentication & Demo Setup
- ✅ Created working demo accounts for all three roles
- ✅ Implemented Supabase RLS policies for role-based data access
- ✅ Fixed Next.js 15 server-side cookie handling with `await cookies()`

### UI/UX Improvements
- ✅ **Color Theme Consistency**: Updated from problematic green accents to cohesive orange theme
- ✅ **Hover States**: Fixed navigation and dashboard card hovers to use primary color with white text
- ✅ **Icon Transitions**: Implemented group hover pattern so icons change to white on hover
- ✅ **Visual Feedback**: Consistent interactive states across all user portals

### Technical Fixes
- ✅ Resolved ESLint unused variable warnings during build
- ✅ Fixed TypeScript strict mode conflicts with shadcn dropdown components
- ✅ Handled Supabase URL validation for build process
- ✅ Updated to modern Next.js 15 patterns

## Development Status

**Foundation Complete**: ✅
- Project setup with all core technologies
- Role-based authentication and routing (Admin/Trainer)
- Database schema and demo data
- Consistent UI theming and navigation
- Build and development processes working

**Member Management System**: ✅ **COMPLETE**
- ✅ Member CRUD operations with comprehensive forms
- ✅ Member list/table view with advanced filtering and pagination
- ✅ Member detail view with tabbed interface
- ✅ Member subscription management (view/add/edit subscriptions)
- ✅ Service layer architecture with proper data transformation
- ✅ Search and filtering system
- ✅ Emergency contact management
- ✅ Member freeze/pause functionality
- ✅ All direct Supabase usage abstracted through service layer

**Next Priority Features**:
- Training session scheduling and management
- Payment processing and history tracking
- Progress tracking (body measurements, photos)
- Attendance tracking and check-in/out
- Member reports and analytics
- Real-time features with Supabase

## Code Quality Standards

**Before any commit**:
1. Run `npm run lint` to check code quality
2. Run `npm run type-check` to verify TypeScript
3. Test with demo accounts to ensure functionality
4. Verify hover states and visual consistency work properly

**Theming Consistency**:
- Always use theme colors (primary/accent) instead of hardcoded colors
- Implement proper hover states with `group` pattern for complex components
- Ensure sufficient contrast (white text on primary background)
- Follow the established orange theme throughout new features

When implementing new features, follow the established patterns of role-based access, proper TypeScript typing, and the two-tier authentication architecture (Admin/Trainer) with member data management that runs throughout the application.

## ✅ Training Session Management System Complete

**Implementation Complete**: Comprehensive training session management system with calendar interface, session scheduling, and conflict detection.

### Implementation Summary

**✅ Phase 1: Database Schema & Service Layer**
- Enhanced `training_sessions` table with 11 new fields including session room, equipment, goals, actual timing, recurring patterns, ratings
- Created `session_comments` table for session notes and timeline
- Created `trainer_availability` table for schedule management
- Created `session_conflicts` table for conflict tracking
- Built comprehensive SessionService with CRUD operations and conflict detection
- Created custom React hooks for session management (`useCalendarSessions`, `useSessionActions`, `useConflictCheck`)

**✅ Phase 2: Calendar Interface & Session Management**
- Built interactive calendar interface using react-big-calendar with event styling and filtering
- Created comprehensive session creation/editing modal with form validation
- Implemented session detail modal with status management, comments, and completion tracking
- Added calendar to admin sidebar navigation at `/admin/calendar`
- Created TrainerService and hooks for trainer data management
- Integrated real-time conflict detection and availability checking

### Key Features Implemented
- **Calendar View**: Month/week/day/agenda views with color-coded session types and status-based styling
- **Session Creation**: Modal form with member search, trainer selection, conflict detection, and comprehensive session details
- **Session Management**: Status workflows (scheduled → confirmed → in-progress → completed), cancellation, rescheduling, no-show tracking
- **Session Details**: Comprehensive detail view with tabs for session info, comments timeline, and completion data
- **Comments System**: Session notes and timeline with categorized comments (note, progress, issue, goal, equipment, feedback, reminder)
- **Conflict Detection**: Real-time checking for trainer availability, overlapping sessions, and room conflicts
- **Session Ratings**: Member and trainer satisfaction ratings (1-5 stars)
- **Equipment & Room Management**: Track required equipment and session locations
- **Recurring Sessions**: Support for recurring session patterns (daily, weekly, monthly)

### Technical Architecture
- **Service Layer**: SessionService handles all database operations with proper error handling
- **Custom Hooks**: Reactive state management with useCalendarSessions, useSessionActions, useConflictCheck
- **Form Validation**: Zod schemas with React Hook Form for robust form handling
- **Real-time Updates**: Calendar automatically refreshes after session changes
- **Type Safety**: Comprehensive TypeScript interfaces for all session-related data structures

The training session management system is now fully functional and integrated into the admin portal, providing a complete solution for scheduling, managing, and tracking training sessions between members and trainers.

## ✅ Architecture Change Complete: Members as Non-Authenticated Entities

**Completed**: Successfully transformed members from authenticated users to managed data records

### Implementation Summary

**✅ Phase 1: Remove Member Portal**
- Deleted `/member` route and all member-facing components
- Removed MemberLayout and member navigation items
- Updated home page routing to only handle admin/trainer redirects

**✅ Phase 2: Remove Member Authentication**
- Removed members from authentication system completely
- Updated User type and constants to remove member role
- Removed member demo account from setup script
- Simplified members table by removing auth-related fields

**✅ Phase 3: Admin Member Management**
- Created comprehensive member CRUD interface in admin portal (`/admin/members`)
- Added member list/table view with search and filtering
- Created member profile forms for adding/editing member details
- Implemented member data operations without authentication requirements

**✅ Phase 4: Database & Security Updates**
- Updated Supabase RLS policies for simplified member data access
- Modified member-related database operations to work without authentication
- Updated database schema to reflect members as standalone records

**New Architecture**:
- **Admin & Trainer**: Authenticated users with portal access
- **Members**: Customer data records managed entirely through CRM interface
- **Two-Portal System**: Admin/Trainer authentication only, no member self-service

The app is now a traditional CRM where members are managed customer data rather than active system users. Members can be created, updated, and managed through the admin interface at `/admin/members`.

## ✅ Member Management System - Implementation Complete

### Core Features Implemented

**✅ Member CRUD Operations**
- Complete member creation with validation (first name, last name, email, phone, join date)
- Member profile editing with all fields
- Member deletion with confirmation dialogs
- Bulk member operations support

**✅ Advanced Member Interface**
- Member list table with pagination and sorting
- Advanced filtering (by status, search term, date ranges)
- Member detail view with comprehensive profile display
- Tabbed interface for subscriptions, payments, sessions, progress, notes

**✅ Subscription Management System**
- Complete subscription service with CRUD operations
- Membership plan selection with visual plan comparison
- Subscription creation with custom pricing and auto-renewal settings
- Subscription status management (active, frozen, cancelled, reactivate)
- Subscription history tracking with action management

**✅ Service Layer Architecture**
- `memberService` - handles all member data operations with proper field transformation
- `subscriptionService` - manages subscriptions and membership plans
- Custom React hooks (`useMembers`, `useMemberActions`, `useSubscriptions`)
- Proper error handling and data validation throughout
- All Supabase queries abstracted through service layer

**✅ Database Integration**
- Robust member table structure with all required fields
- Membership plans and subscriptions tables with proper relationships
- Row Level Security (RLS) policies for admin/trainer access
- UUID generation and proper data constraints
- Database field transformation (e.g., `first_name` ↔ `firstName`)

**✅ UI/UX Components**
- Consistent form validation with React Hook Form + Zod
- Error handling with user-friendly messages
- Loading states and progress indicators
- Confirmation dialogs for destructive actions
- Responsive design with proper mobile support

### Technical Architecture

**Service Layer Pattern**: All database operations go through dedicated services that handle:
- Data transformation between database and frontend formats
- Error handling and validation
- Type safety with TypeScript interfaces
- Consistent API response patterns

**Hook-Based State Management**: Custom hooks provide:
- Reactive data fetching with loading states
- Automatic refetching and cache invalidation
- Action methods with proper error handling
- Separation of concerns between UI and data logic

**Database Schema**: Properly structured with:
- Member table as standalone records (no authentication)
- Subscription tracking with membership plan relationships
- Proper foreign key constraints and data integrity
- RLS policies ensuring only admins/trainers can access data

The member management system is now production-ready and follows all established patterns for future feature development.

## 🚀 Ready for Training Session Management

The next major feature to implement is **Training Session Management**, which will include:
- Session scheduling between trainers and members
- Session type management (personal, group, class)
- Calendar integration and time slot management
- Session status tracking (scheduled, completed, cancelled, no-show)
- Session notes and progress tracking
- Trainer availability management

*Waiting for specific requirements and user workflow details for training session management implementation.*