# Group Policies Capability

## ADDED Requirements

### Requirement: Group Policies Tab
The system SHALL display a Policies tab on the group detail page for managing group policy attachments.

#### Scenario: View group policies tab
- **WHEN** user views the group detail page
- **THEN** the system displays Profile, Members, and Policies tabs
- **AND** the Policies tab is accessible via tab navigation

#### Scenario: View attached policies
- **WHEN** user selects the Policies tab on a group detail page
- **THEN** the system displays a list of policies attached to the group
- **AND** shows policy name, description, and version

### Requirement: Group Policy Attachment
The system SHALL allow attaching policies to groups.

#### Scenario: Attach policy to group
- **WHEN** user selects a policy from the policy picker and clicks Attach
- **THEN** the system attaches the policy to the group using principalUrn `urn:group:{id}`
- **AND** refreshes the attached policies list
- **AND** shows success feedback

### Requirement: Group Policy Detachment
The system SHALL allow detaching policies from groups.

#### Scenario: Detach policy from group
- **WHEN** user clicks detach on an attached policy
- **THEN** the system detaches the policy from the group
- **AND** refreshes the attached policies list
- **AND** shows success feedback
