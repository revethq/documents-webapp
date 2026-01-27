# User Policies Capability

## ADDED Requirements

### Requirement: User Policy Tab
The system SHALL display a Policies tab on the user detail page for managing user policy attachments.

#### Scenario: View user policies tab
- **WHEN** user views the user detail page
- **THEN** the system displays Profile, Permissions, and Policies tabs
- **AND** the Policies tab is accessible via tab navigation

#### Scenario: View attached policies
- **WHEN** user selects the Policies tab on a user detail page
- **THEN** the system displays a list of policies attached to the user
- **AND** shows policy name, description, and attachment date

### Requirement: User Policy Attachment
The system SHALL allow attaching policies to users.

#### Scenario: Attach policy to user
- **WHEN** user selects a policy from the policy picker and clicks Attach
- **THEN** the system attaches the policy to the user using principalUrn `urn:user:{uuid}`
- **AND** refreshes the attached policies list
- **AND** shows success feedback

### Requirement: User Policy Detachment
The system SHALL allow detaching policies from users.

#### Scenario: Detach policy from user
- **WHEN** user clicks detach on an attached policy
- **THEN** the system detaches the policy from the user
- **AND** refreshes the attached policies list
- **AND** shows success feedback
