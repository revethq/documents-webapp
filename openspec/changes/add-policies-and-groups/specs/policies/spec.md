# Policies Capability

## ADDED Requirements

### Requirement: Policy List View
The system SHALL display a paginated list of all policies accessible to the current user.

#### Scenario: View policies list
- **WHEN** user navigates to /policies
- **THEN** the system displays a list of policies with name, description, version, statement count, and created date
- **AND** provides a "Create Policy" action button

#### Scenario: Delete policy from list
- **WHEN** user clicks delete on a policy
- **THEN** the system shows a confirmation dialog
- **AND** upon confirmation, deletes the policy and refreshes the list

### Requirement: Policy Creation with Visual Editor
The system SHALL provide a visual editor for creating policies with an intuitive form-based interface.

#### Scenario: Create policy with visual editor
- **WHEN** user navigates to /policies/new
- **THEN** the system displays a form with name, description, and version fields
- **AND** provides a visual editor with statement management
- **AND** each statement allows selecting effect (Allow/Deny), multiple actions, and resources

#### Scenario: Add statement in visual editor
- **WHEN** user clicks "Add Statement" in visual editor
- **THEN** the system adds a new statement card with default values (Allow, empty actions, empty resources)
- **AND** user can configure the statement using form controls

#### Scenario: Select actions with categorized picker
- **WHEN** user opens the action picker in a statement
- **THEN** the system displays actions grouped by resource type (Organization, Project, Document, etc.)
- **AND** provides search functionality to filter actions
- **AND** allows multi-select of actions

### Requirement: Policy Creation with JSON Editor
The system SHALL provide a JSON editor for creating policies with raw JSON input.

#### Scenario: Create policy with JSON editor
- **WHEN** user switches to JSON editor tab
- **THEN** the system displays a text area with the current policy as formatted JSON
- **AND** user can edit the JSON directly

#### Scenario: Switch between visual and JSON modes
- **WHEN** user switches from visual editor to JSON editor
- **THEN** the system serializes the current visual state to JSON
- **WHEN** user switches from JSON editor to visual editor
- **THEN** the system parses the JSON and populates the visual form
- **AND** shows a validation error if JSON is invalid

### Requirement: Policy Detail View
The system SHALL display policy details and allow editing existing policies.

#### Scenario: View policy details
- **WHEN** user navigates to /policies/{id}
- **THEN** the system displays the policy metadata and statements
- **AND** shows the list of principals (users/groups) the policy is attached to

#### Scenario: Edit existing policy
- **WHEN** user modifies a policy and clicks save
- **THEN** the system updates the policy via API
- **AND** shows success feedback

### Requirement: Policy Attachment Viewing
The system SHALL display which users and groups have a policy attached.

#### Scenario: View policy attachments
- **WHEN** viewing a policy detail page
- **THEN** the system displays a list of attached principals with their URNs
- **AND** shows the attachment date
