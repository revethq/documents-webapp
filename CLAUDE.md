<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Kala WebApp - Project Documentation

## Project Overview

**Project Name:** kala-webapp
**Version:** 0.1.0
**Type:** Next.js Web Application (Frontend)
**Backend:** Django Kala App (Document Management System)
**Status:** Initial Setup Complete

## What is Kala?

Kala is a comprehensive document management and project organization system. This Next.js application serves as the **modern frontend interface** for the Kala Django backend.

### Backend Capabilities (Django Kala App)

The backend provides:
- **Document Management**: Upload, version control, and organize documents
- **Project Organization**: Organize documents by Organizations and Projects
- **Hierarchical Permissions**: Multi-level access control (Organization → Project → Document)
- **User Management**: Authentication, invitations, and role-based access
- **Search & Discovery**: Full-text search across documents with tag-based filtering
- **Export Functionality**: Archive and share projects/documents
- **REST API**: Modern v1 API and Basecamp Classic compatibility
- **Authentication**: OIDC and traditional login support
- **Async Processing**: Celery-based background tasks for exports and deletions

### This Frontend Application

This Next.js app will provide:
- Modern, responsive UI for document management
- Real-time interactions with the Django backend API
- Improved user experience over the legacy Django templates
- Mobile-friendly interface
- Enhanced search and filtering capabilities

## Technology Stack

### Core Framework
- **Next.js:** 16.1.1 (Latest stable version with App Router)
- **React:** 19.2.0
- **React DOM:** 19.2.0

### Data Fetching & API
- **TanStack React Query:** v5.90.9 (Server state management and caching)
- **Orval:** v8.0.0-rc.2 (OpenAPI client generator)

### Styling & UI
- **Tailwind CSS:** v4 (Utility-first CSS framework)
- **PostCSS:** @tailwindcss/postcss v4
- **Headless UI:** v2.2.9 (Unstyled, accessible UI components)
- **Heroicons:** v2.2.0 (Icon library for React)

### Development Tools
- **TypeScript:** v5 (Type-safe JavaScript)
- **ESLint:** v9 (Code linting and quality)
- **eslint-config-next:** 16.0.3 (Next.js specific linting rules)

### Type Definitions
- @types/node (v20)
- @types/react (v19)
- @types/react-dom (v19)

## Project Structure

```
kala-webapp/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout with full-height styling
│   │   └── page.tsx      # Home page (Dashboard)
│   └── components/       # Reusable UI components
│       ├── app-layout.tsx    # Main application layout (Headless UI sidebar)
│       ├── alert.tsx
│       ├── auth-layout.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── checkbox.tsx
│       ├── combobox.tsx
│       ├── description-list.tsx
│       ├── dialog.tsx
│       ├── divider.tsx
│       ├── dropdown.tsx
│       ├── fieldset.tsx
│       ├── heading.tsx
│       ├── input.tsx
│       ├── link.tsx
│       ├── listbox.tsx
│       ├── navbar.tsx
│       ├── pagination.tsx
│       ├── radio.tsx
│       ├── select.tsx
│       ├── sidebar-layout.tsx
│       ├── sidebar.tsx
│       ├── stacked-layout.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tag-selector.tsx
│       ├── textarea.tsx
│       └── text.tsx
├── public/               # Static assets
├── node_modules/         # Dependencies
├── .next/                # Next.js build output
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── next-env.d.ts         # Next.js TypeScript declarations
├── postcss.config.mjs    # PostCSS configuration
├── tsconfig.json         # TypeScript configuration (@ alias points to ./src/*)
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Locked dependency versions
├── .gitignore            # Git ignore rules
├── README.md             # Project README
└── CLAUDE.md             # This file - Project documentation

```

## Component Library

The project includes a comprehensive set of pre-built UI components located in `src/components/`:

### Layout Components
- **app-layout.tsx** - Main application layout with responsive sidebar (Headless UI)
  - Mobile: Slide-out sidebar with overlay
  - Desktop: Fixed sidebar with navigation
  - Includes user profile section and team navigation
- **auth-layout.tsx** - Authentication page layouts
- **sidebar-layout.tsx** - Sidebar-based page layouts
- **stacked-layout.tsx** - Stacked content layouts
- **navbar.tsx** - Navigation bar component
- **sidebar.tsx** - Sidebar navigation component

### Form Components
- **button.tsx** - Button component with various styles
- **input.tsx** - Text input fields
- **textarea.tsx** - Multi-line text input
- **checkbox.tsx** - Checkbox input
- **radio.tsx** - Radio button input
- **switch.tsx** - Toggle switch component
- **select.tsx** - Dropdown select
- **combobox.tsx** - Autocomplete combobox
- **listbox.tsx** - List selection component
- **fieldset.tsx** - Form field grouping

### UI Components
- **alert.tsx** - Alert/notification messages
- **avatar.tsx** - User avatar display
- **badge.tsx** - Label badges
- **dialog.tsx** - Modal dialogs
- **divider.tsx** - Visual dividers
- **dropdown.tsx** - Dropdown menus
- **heading.tsx** - Typography headings
- **link.tsx** - Styled links
- **pagination.tsx** - Page navigation
- **table.tsx** - Data tables
- **text.tsx** - Text components
- **tag-selector.tsx** - Tag selection interface
- **description-list.tsx** - Definition/description lists

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint for code quality checks
npm run generate:api # Generate API client from OpenAPI spec (Orval)
```

## Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Access Application:**
   - Open browser to http://localhost:3000

## Configuration Files

### TypeScript (tsconfig.json)
- Configured for Next.js with strict type checking
- Module resolution optimized for App Router
- Path alias `@/*` points to `./src/*` for cleaner imports

### ESLint (eslint.config.mjs)
- Next.js recommended configuration
- Enforces code quality and best practices

### Tailwind CSS
- Using Tailwind v4 with PostCSS
- Configured for dark mode support
- Utility-first styling approach

## Architecture Notes

### App Router Structure
- Uses Next.js 13+ App Router (not Pages Router)
- Server Components by default
- File-based routing in `src/app/`
- Supports React Server Components

### Source Directory
- Project uses `src/` directory structure (preferred organization pattern)
- All application code lives under `src/`
- Cleaner separation from configuration files

### Styling Approach
- Tailwind CSS v4 for utility-first styling
- Dark mode support built-in
- Responsive design with mobile-first approach

## Git Repository

- Git repository initialized
- Standard Next.js `.gitignore` configured
- Excludes: node_modules, .next, build artifacts

## Backend Integration Plan

This frontend will integrate with the Django Kala App backend API:

### Authentication
- Integrate with Django OIDC or session-based auth
- Handle JWT tokens or session cookies
- Implement protected routes and auth state management

### API Endpoints to Integrate
Based on the Django backend structure:

1. **Organizations API** (`/v1/organizations/`)
   - List organizations user has access to
   - Create/update/delete organizations
   - Manage organization members and permissions

2. **Projects API** (`/v1/projects/`)
   - List projects within organizations
   - Create/update/delete projects
   - Manage project categories and tags
   - Handle project permissions and client access

3. **Documents API** (`/v1/documents/`)
   - Upload documents with version tracking
   - List/search documents with filtering
   - Download document versions
   - Manage document permissions
   - Handle MIME type categorization

4. **Users API** (`/v1/users/`)
   - User profile management
   - Avatar upload
   - Invite functionality
   - User settings

5. **Export API**
   - Trigger project/document exports
   - Track export status (async Celery tasks)
   - Download completed exports

### Data Models to Implement (TypeScript)

```typescript
// Mirror Django models in TypeScript
interface User {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  avatar_url?: string;
  timezone: string;
  organizations: Organization[];
}

interface Organization {
  id: number;
  uuid: string;
  name: string;
  address?: string;
  locale: string;
  timezone: string;
  is_active: boolean;
}

interface Project {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  organization: number;
  tags: string[];
  is_active: boolean;
  created: string;
  changed: string;
}

interface Document {
  id: number;
  uuid: string;
  project: number;
  category?: number;
  mime: string;
  is_active: boolean;
  tags: string[];
  created: string;
}

interface DocumentVersion {
  id: number;
  uuid: string;
  document: number;
  file?: string;
  url?: string;
  name: string;
  description?: string;
  mime: string;
  size: number;
  created: string;
  user: number;
}
```

## Current Implementation Status

### Completed
- ✅ Next.js 16 with App Router setup
- ✅ TypeScript configuration with `@/*` path aliases
- ✅ Tailwind CSS v4 styling
- ✅ Headless UI integration
- ✅ Main application layout with responsive sidebar
- ✅ Dark mode support
- ✅ Component library (forms, UI elements, layouts)

### Next Steps

1. **API Client Setup**
   - Configure API base URL (environment variables)
   - Set up axios or fetch wrapper for API calls
   - Implement request/response interceptors
   - Handle authentication headers

2. **Authentication Implementation**
   - Login/logout flows
   - Session/token management
   - Protected route middleware
   - User context provider

3. **Core Pages Development**
   - Dashboard (home)
   - Organizations list and detail pages
   - Projects list and detail pages
   - Document browser and upload
   - User profile and settings
   - Search functionality

4. **State Management**
   - Choose solution (Context API, Zustand, or Redux)
   - Implement global state for user, organizations, projects
   - Cache management for API responses

5. **File Upload & Management**
   - Document upload interface with drag-and-drop
   - Version history display
   - Download functionality
   - Preview support for common file types

6. **Permission Handling**
   - Implement permission checks in UI
   - Hide/disable features based on user permissions
   - Mirror backend permission hierarchy

## Notes

- Project created on November 15, 2025
- Using latest stable versions of Next.js, React, and Tailwind
- Designed as modern frontend replacement for Django template-based UI
- Will consume Django REST API (v1) endpoints
- Component library ready for rapid feature development
