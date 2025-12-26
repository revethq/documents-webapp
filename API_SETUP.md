# Orval + React Query Setup Guide

This project uses **Orval** to auto-generate React Query hooks from the Django Kala backend OpenAPI specification.

## Quick Start

### 1. Setup Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local if your backend runs on a different port
# NEXT_PUBLIC_API_URL=http://localhost:5051
```

### 2. Make Sure Backend is Running

Your Django backend must be running and accessible:

```bash
# Backend should be at: http://localhost:5051
# OpenAPI spec at: http://localhost:5051/openapi?format=json
```

### 3. Generate API Client

```bash
npm run generate:api
```

This will create:
- **Type definitions** in `src/lib/api/models/`
- **React Query hooks** in `src/lib/api/generated/`

## How to Use Generated Hooks

### Fetching Data (Queries)

```typescript
import { useGetOrganizations } from '@/lib/api/generated/organizations';

function OrganizationsPage() {
  const { data, isLoading, error, refetch } = useGetOrganizations();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(org => (
        <div key={org.id}>{org.name}</div>
      ))}
    </div>
  );
}
```

### Mutations (Create, Update, Delete)

```typescript
import { useCreateOrganization } from '@/lib/api/generated/organizations';

function CreateOrgButton() {
  const createOrg = useCreateOrganization();

  const handleCreate = async () => {
    try {
      await createOrg.mutateAsync({
        data: {
          name: 'Engineering',
          address: '123 Main St',
          locale: 'en-US',
          timezone: 'America/New_York',
        }
      });
      alert('Organization created!');
    } catch (error) {
      alert('Error creating organization');
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createOrg.isPending}
    >
      {createOrg.isPending ? 'Creating...' : 'Create Org'}
    </button>
  );
}
```

### With Parameters

```typescript
import { useGetOrganizationById } from '@/lib/api/generated/organizations';

function OrganizationDetail({ id }: { id: number }) {
  const { data } = useGetOrganizationById(id);

  return <div>{data?.name}</div>;
}
```

## Workflow

### Daily Development

1. Start backend: `cd ../kala-app && docker-compose up`
2. Start frontend: `npm run dev`
3. Code your features using the generated hooks!

### When Backend API Changes

1. Pull latest backend changes
2. Restart backend
3. Regenerate client: `npm run generate:api`
4. Update your frontend code if types changed

## Configuration

### orval.config.ts

The Orval configuration file controls how the API client is generated:

```typescript
{
  input: 'http://localhost:5051/openapi?format=json',  // OpenAPI spec URL
  output: {
    mode: 'tags-split',        // Split by OpenAPI tags
    target: 'src/lib/api/generated',
    client: 'react-query',     // Generate React Query hooks
    httpClient: 'fetch',       // Use native fetch
  }
}
```

### Custom Fetch Client

The `src/lib/api/client.ts` file wraps fetch to add:
- Base URL handling
- Authentication headers (TODO: implement)
- Error handling
- Cookie credentials for session auth

## Available Hooks Pattern

Orval generates hooks based on your OpenAPI spec. Common patterns:

### Queries (GET requests)
- `useGet{Resource}()` - List all
- `useGet{Resource}ById(id)` - Get single item
- `useGet{Resource}Search(params)` - Search/filter

### Mutations (POST/PUT/DELETE)
- `useCreate{Resource}()` - Create new
- `useUpdate{Resource}()` - Update existing
- `useDelete{Resource}()` - Delete item

*Note: Exact hook names depend on your OpenAPI spec's operationIds*

## React Query Features

All generated hooks support React Query features:

```typescript
const { data, isLoading, error, refetch } = useGetOrganizations({
  query: {
    enabled: true,              // Only run when enabled
    refetchInterval: 5000,      // Poll every 5 seconds
    staleTime: 60000,          // Consider fresh for 1 minute
  }
});
```

## Troubleshooting

### "Failed to fetch OpenAPI spec"
- Ensure backend is running at `http://localhost:5051`
- Check that `/openapi?format=json` endpoint is accessible
- Verify CORS settings if needed

### "Module not found" after generation
- Restart Next.js dev server
- Check that files were generated in `src/lib/api/generated/`

### Type errors after regeneration
- The API schema changed - update your code to match new types
- TypeScript will show you exactly what changed

## Best Practices

1. **Regenerate regularly** - Run `npm run generate:api` after pulling backend changes
2. **Don't edit generated files** - They'll be overwritten
3. **Use TypeScript** - Full type safety from backend to frontend
4. **Handle loading/error states** - Always check `isLoading` and `error`
5. **Invalidate queries** - After mutations, invalidate related queries to refetch fresh data

## Next Steps

- [ ] Implement authentication token management in `client.ts`
- [ ] Add optimistic updates for mutations
- [ ] Set up React Query DevTools for debugging
- [ ] Configure query retry and caching strategies per endpoint
