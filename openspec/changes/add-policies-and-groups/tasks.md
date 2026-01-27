# Tasks: Add Policies and Policy Attachments

## 1. Policies Module

### 1.1 Policies List Page
- [x] 1.1.1 Create `src/app/policies/page.tsx` with list view
- [x] 1.1.2 Use `useGetPolicies` hook to fetch policies
- [x] 1.1.3 Display policy name, description, version, statement count, created date
- [x] 1.1.4 Add "Create Policy" action button
- [x] 1.1.5 Add delete functionality with confirmation dialog

### 1.2 Policy Editor Components
- [x] 1.2.1 Create `src/lib/policy-actions.ts` with categorized action definitions
- [x] 1.2.2 Create `src/components/policy-editor/action-picker.tsx` - searchable multi-select with categories
- [x] 1.2.3 Create `src/components/policy-editor/statement-card.tsx` - single statement editor
- [x] 1.2.4 Create `src/components/policy-editor/visual-editor.tsx` - statement list with add/remove
- [x] 1.2.5 Create `src/components/policy-editor/json-editor.tsx` - textarea-based JSON editing
- [x] 1.2.6 Create `src/components/policy-editor/policy-editor.tsx` - tabbed container for both modes

### 1.3 Policy Create Page
- [x] 1.3.1 Create `src/app/policies/new/page.tsx`
- [x] 1.3.2 Implement policy metadata form (name, description, version)
- [x] 1.3.3 Integrate policy editor component with mode switching
- [x] 1.3.4 Use `usePostPolicies` mutation for save
- [x] 1.3.5 Invalidate policies query and redirect on success

### 1.4 Policy Detail/Edit Page
- [x] 1.4.1 Create `src/app/policies/[id]/page.tsx`
- [x] 1.4.2 Use `useGetPoliciesId` to load existing policy
- [x] 1.4.3 Pre-populate editor with existing statements
- [x] 1.4.4 Use `usePutPoliciesId` mutation for updates
- [x] 1.4.5 Show policy attachments section using `useGetPoliciesIdAttachments`

## 2. Group Policies Integration

### 2.1 Update Group Detail Page
- [x] 2.1.1 Add "policies" to TabType union in `src/app/groups/[id]/page.tsx`
- [x] 2.1.2 Add Policies tab button to tab navigation
- [x] 2.1.3 Create policies tab content section
- [x] 2.1.4 Use `useGetGroupsIdPolicies` to list attached policies
- [x] 2.1.5 Use `useGetPolicies` to populate policy picker for attachment
- [x] 2.1.6 Use `usePostPoliciesIdAttachments` with `urn:group:{id}` to attach
- [x] 2.1.7 Use `useDeletePoliciesIdAttachmentsPrincipalUrn` to detach

## 3. User Policies Integration

### 3.1 Update User Detail Page
- [x] 3.1.1 Add "policies" to TabType union in `src/app/users/[uuid]/page.tsx`
- [x] 3.1.2 Add Policies tab button to tab navigation
- [x] 3.1.3 Create policies tab content section
- [x] 3.1.4 Use `useGetUsersIdPolicies` to list attached policies
- [x] 3.1.5 Use `useGetPolicies` to populate policy picker for attachment
- [x] 3.1.6 Use `usePostPoliciesIdAttachments` with `urn:user:{uuid}` to attach
- [x] 3.1.7 Use `useDeletePoliciesIdAttachmentsPrincipalUrn` to detach

## 4. Navigation Updates

### 4.1 Sidebar Navigation
- [x] 4.1.1 Add "Policies" nav item to `app-layout.tsx` (ShieldCheckIcon)

## 5. Validation

### 5.1 Manual Testing
- [ ] 5.1.1 Test policy CRUD operations
- [ ] 5.1.2 Test visual editor mode switching
- [ ] 5.1.3 Test policy attachment to groups
- [ ] 5.1.4 Test policy attachment to users
- [ ] 5.1.5 Verify navigation links work correctly
