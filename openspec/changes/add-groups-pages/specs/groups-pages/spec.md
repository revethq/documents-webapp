## ADDED Requirements

### Requirement: Groups List Page
The system SHALL provide a `/groups` page that displays all groups in a searchable table format.

#### Scenario: View groups list
- **WHEN** user navigates to `/groups`
- **THEN** the system displays a table of all groups with columns for display name
- **AND** displays an "Add group" action button in the page header

#### Scenario: Search groups
- **WHEN** user enters text in the search field
- **THEN** the table filters to show only groups whose display name contains the search text

#### Scenario: Empty state
- **WHEN** no groups exist or search returns no results
- **THEN** the system displays an empty state with appropriate messaging and an action to create a group

### Requirement: Group Creation Page
The system SHALL provide a `/groups/new` page with a wizard to create new groups.

#### Scenario: Create group with display name
- **WHEN** user navigates to `/groups/new`
- **AND** enters a display name
- **AND** submits the form
- **THEN** the system creates the group via POST /groups
- **AND** redirects to the new group's detail page

#### Scenario: Cancel creation
- **WHEN** user clicks cancel during group creation
- **THEN** the system navigates back to the groups list without creating a group

### Requirement: Group Detail Page
The system SHALL provide a `/groups/[id]` page to view and edit group details.

#### Scenario: View group profile
- **WHEN** user navigates to `/groups/{id}`
- **THEN** the system displays the group's display name in an editable form
- **AND** displays created and updated timestamps

#### Scenario: Update group profile
- **WHEN** user modifies the display name and saves
- **THEN** the system updates the group via PUT /groups/{id}
- **AND** displays a success indication

### Requirement: Group Members Management
The system SHALL provide a members tab on the group detail page to manage group membership.

#### Scenario: View group members
- **WHEN** user views the members tab
- **THEN** the system displays a list of all members (users and nested groups)
- **AND** shows member type (USER or GROUP) for each member

#### Scenario: Add member to group
- **WHEN** user selects a user or group to add
- **AND** confirms the selection
- **THEN** the system adds the member via POST /groups/{id}/members
- **AND** refreshes the members list

#### Scenario: Remove member from group
- **WHEN** user clicks remove on a member
- **THEN** the system removes the member via DELETE /groups/{id}/members/{memberId}
- **AND** refreshes the members list

### Requirement: Groups Navigation
The system SHALL include a Groups item in the main navigation sidebar.

#### Scenario: Navigate to groups
- **WHEN** user clicks the Groups item in the sidebar
- **THEN** the system navigates to `/groups`
