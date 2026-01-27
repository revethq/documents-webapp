# Change: Add Policies Management and Policy Attachments

## Why
The application needs a policy-based access control system to manage fine-grained permissions for users and groups. The backend API already supports policies (with statements containing effects, actions, and resources) and policy attachments to principals (users/groups). The frontend currently lacks UI for managing policies and attaching them to users/groups.

## What Changes
- Add a new **Policies** section to the sidebar navigation
- Create Policies list page showing all existing policies
- Create Policy creation page with dual editing modes:
  - WYSIWYG editor for building policy statements visually (action picker, resource input, effect toggle)
  - JSON editor for advanced users who prefer raw policy editing
- Create Policy detail/edit page
- Update existing **Groups** detail page to add a **Policies** tab for viewing and managing attached policies
- Update existing **Users** detail page to add a **Policies** tab for viewing and managing attached policies

## Impact
- Affected specs: `policies` (new), `group-policies` (new), `user-policies` (new)
- Affected code:
  - `src/components/app-layout.tsx` - Add Policies navigation item
  - `src/app/policies/` - New page directory (list, new, [id])
  - `src/app/groups/[id]/page.tsx` - Add policies tab
  - `src/app/users/[uuid]/page.tsx` - Add policies tab
  - `src/components/policy-editor/` - New WYSIWYG policy editor component
