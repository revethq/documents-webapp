# Project Context

## Purpose
Revet Documents WebApp is a modern Next.js frontend for the Revet Documents management system. It provides a responsive, user-friendly interface for:
- Uploading and managing documents with version control
- Organizing documents into projects and categories
- Managing organizations and user access
- Searching and filtering documents with tags
- Downloading and exporting documents

The backend is a Kotlin + Quarkus REST API.

## Tech Stack
- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4
- **Components**: Headless UI v2.2.9, Heroicons v2.2.0
- **Data Fetching**: TanStack React Query v5.90.9
- **API Client**: Generated via Orval v8 from OpenAPI spec
- **Virtualization**: TanStack React Virtual v3.13.13
- **Animation**: Motion v12.23.26
- **Authentication**: OIDC via oidc-client-ts and react-oidc-context

## Project Conventions

### Code Style
- Use `'use client'` directive for client components that need hooks or interactivity
- Import path alias: `@/*` maps to `./src/*`
- Component files use kebab-case (e.g., `app-layout.tsx`, `page-header.tsx`)
- Pages are located in `src/app/` following Next.js App Router conventions
- Reusable components live in `src/components/`
- API-related code is in `src/lib/api/` with generated code in `src/lib/api/generated/`
- ESLint with Next.js core-web-vitals and TypeScript configs
- Generated API code has relaxed linting rules (react-hooks/immutability off)

### Architecture Patterns
- **App Router**: File-based routing with `src/app/` directory
- **Client-side data fetching**: React Query hooks for all API calls
- **Generated API client**: Orval generates typed hooks from OpenAPI spec
  - Hooks follow pattern: `useGetApiV1<Resource>()`, `usePostApiV1<Resource>()`
  - Query keys: `getGetApiV1<Resource>QueryKey()`
- **Layout hierarchy**: `RootLayout` → `AuthProvider` → `QueryProvider` → `AppLayout` → Page
- **Infinite scrolling**: useInfiniteQuery + TanStack Virtual for large lists
- **Form state**: Local useState for form inputs, React Query for server state
- **Error handling**: `getErrorMessage()` utility, `ErrorBanner` component for display

### Testing Strategy
No testing framework currently configured. When adding tests, consider:
- Jest or Vitest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

### Git Workflow
- Main branch: `main`
- Feature branches for new work
- Commit messages should be descriptive and explain the "why"

## Domain Context
The Revet Documents system organizes data hierarchically:
- **Organizations**: Top-level containers with their own settings and storage buckets
- **Projects**: Belong to organizations, contain documents and categories
- **Categories**: Optional groupings within projects
- **Documents**: Files with version history, tags, and metadata
- **Document Versions**: Individual versions of a document with file data
- **Tags**: Cross-cutting labels that can be applied to documents
- **Users**: Have access to organizations/projects based on permissions

Key relationships:
- A document belongs to exactly one project
- A project belongs to exactly one organization
- Documents can only be downloaded if their organization has a storage bucket configured
- Tags are global and referenced by slug

## Important Constraints
- Backend API is Kotlin + Quarkus with REST endpoints at `/v1/*`
- API types/hooks are generated from OpenAPI spec - do not edit `src/lib/api/generated/`
- Authentication is handled via OIDC - the app redirects to an identity provider
- All API requests go through the `apiFetch` mutator in `src/lib/api/client.ts`
- Large lists (documents) use virtualization for performance

## External Dependencies
- **Revet Documents Backend API**: Kotlin + Quarkus REST API providing all data endpoints
  - OpenAPI spec fetched and stored as `openapi.json`
  - Run `npm run generate:api` to regenerate client after spec changes
- **OIDC Identity Provider**: External auth service for user authentication
- **Object Storage**: Backend uses S3-compatible storage for document files (configured per-organization)
