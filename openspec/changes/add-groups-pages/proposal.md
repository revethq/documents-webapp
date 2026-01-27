# Change: Add Groups Management Pages

## Why
The Groups API is now available but the webapp has no UI for managing groups. Users need the ability to view, create, edit, and manage group membership through the web interface, following the same patterns established by the Users pages.

## What Changes
- Add `/groups` page - List all groups with search functionality
- Add `/groups/new` page - Multi-step wizard to create a new group
- Add `/groups/[id]` page - Detail page with tabs for profile editing and member management
- Add Groups navigation item to the sidebar

## Impact
- Affected specs: New `groups-pages` capability
- Affected code:
  - `src/app/groups/page.tsx` (new)
  - `src/app/groups/new/page.tsx` (new)
  - `src/app/groups/[id]/page.tsx` (new)
  - `src/components/app-layout.tsx` (modify - add navigation)
