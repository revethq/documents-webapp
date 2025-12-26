# Kala API Client

This directory contains the auto-generated API client code from the Django Kala backend.

## Setup

1. **Copy environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Make sure your Django backend is running:**
   ```bash
   # The backend should be accessible at http://localhost:5051
   # The OpenAPI spec should be available at http://localhost:5051/openapi?format=json
   ```

3. **Generate API client:**
   ```bash
   npm run generate:api
   ```

   This will:
   - Fetch the OpenAPI spec from your Django backend
   - Generate TypeScript types in `src/lib/api/models/`
   - Generate React Query hooks in `src/lib/api/generated/`

## Usage

The generated code provides React Query hooks for all API endpoints:

```typescript
import { useGetOrganizations, useCreateOrganization } from '@/lib/api/generated/organizations';

function OrganizationsPage() {
  // Query hook
  const { data, isLoading, error } = useGetOrganizations();

  // Mutation hook
  const createOrganization = useCreateOrganization();

  const handleCreate = () => {
    createOrganization.mutate({
      data: {
        name: 'New Organization',
        // ... other fields
      }
    });
  };

  return (
    // Your component JSX
  );
}
```

## Configuration

- **orval.config.ts** - Orval configuration for code generation
- **client.ts** - Custom fetch wrapper with authentication and error handling

## Regenerating

Run `npm run generate:api` whenever:
- The Django backend API changes
- New endpoints are added
- Request/response schemas are modified

## Authentication

The custom fetch client (`client.ts`) handles:
- Base URL configuration
- Authentication headers (TODO: implement token management)
- Cookie-based session authentication
- Error handling
- Content-Type headers

## Folder Structure

```
src/lib/api/
├── client.ts              # Custom fetch wrapper
├── generated/             # Auto-generated React Query hooks (gitignored)
│   ├── organizations.ts
│   ├── projects.ts
│   ├── documents.ts
│   └── users.ts
├── models/                # Auto-generated TypeScript types (gitignored)
│   └── *.ts
└── README.md              # This file
```

## Notes

- Generated files are in `.gitignore` - don't commit them
- Always regenerate after pulling backend changes
- The API base URL defaults to `http://localhost:5051` but can be configured via `NEXT_PUBLIC_API_URL`
