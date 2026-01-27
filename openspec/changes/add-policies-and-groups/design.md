# Design: Policies and Groups UI

## Context
The Revet Documents backend implements an AWS IAM-style policy system with:
- **Policies** containing multiple **Statements**
- Each statement has: `sid` (optional), `effect` (Allow/Deny), `actions[]`, `resources[]`, `conditions` (optional)
- Policies can be attached to **Users** and **Groups** via `principalUrn` (e.g., `urn:user:{uuid}`, `urn:group:{id}`)

The frontend needs to provide both power-user and guided experiences for policy authoring.

## Goals / Non-Goals

**Goals:**
- Provide intuitive WYSIWYG editor for non-technical users to build policies
- Provide JSON editor for power users who prefer direct editing
- Allow seamless switching between WYSIWYG and JSON modes
- Display all available actions organized by resource type
- Manage group membership and policy attachments

**Non-Goals:**
- Policy simulation/testing UI (future enhancement)
- Bulk policy operations
- Policy versioning UI (backend tracks version, but no version history browsing)
- Condition builder UI (conditions can be edited via JSON only)

## Decisions

### Decision: Dual-mode Policy Editor
Implement a tabbed interface with two modes:
- **Visual Editor**: Form-based statement builder with action picker
- **JSON Editor**: Monaco/CodeMirror-based raw JSON editing

**Rationale:** Different users have different preferences. Visual mode lowers the barrier for simple policies; JSON mode gives full control for complex scenarios.

### Decision: Action Picker Component
Create a searchable, categorized action picker showing all available actions grouped by resource type:
- Organization (5 actions)
- Project (9 actions)
- Document (8 actions)
- DocumentVersion (6 actions)
- Category (5 actions)
- Tag (5 actions)
- Bucket (5 actions)
- User (5 actions)
- FileUpload (3 actions)
- Search (1 action)

Plus wildcards: `documents:*` (all actions), `*` (global wildcard)

**Rationale:** The provided action list is comprehensive but can be overwhelming. Categorization with search makes it manageable.

### Decision: No External WYSIWYG Library
Build the visual editor using existing Headless UI components (Combobox, Select, Checkbox) rather than a rich text WYSIWYG library.

**Rationale:** We're building a structured form, not a rich text editor. Reusing existing component library maintains consistency and reduces bundle size.

### Decision: Sync Strategy Between Modes
When switching from Visual to JSON: serialize current state to JSON.
When switching from JSON to Visual: parse JSON and populate form if valid; show validation error if invalid.

**Rationale:** Prevents data loss while allowing power users to make edits not supported by the visual UI.

## Component Architecture

```
PolicyEditorPage
├── PolicyMetadataForm (name, description, version)
├── PolicyEditorTabs
│   ├── VisualEditor
│   │   ├── StatementList
│   │   │   └── StatementCard (repeated)
│   │   │       ├── EffectToggle (Allow/Deny)
│   │   │       ├── ActionPicker (multi-select with categories)
│   │   │       └── ResourceInput (text input with suggestions)
│   │   └── AddStatementButton
│   └── JsonEditor
│       └── CodeEditor (textarea or Monaco)
└── SaveButton
```

## Risks / Trade-offs

- **Risk:** JSON parse errors when switching modes
  - **Mitigation:** Validate before switch; keep last valid state; show clear error messages

- **Risk:** WYSIWYG can't express all policy features (e.g., conditions)
  - **Mitigation:** Allow JSON-only editing for advanced features; show warning in Visual mode if conditions exist

- **Trade-off:** Building custom action picker vs. simple multiselect
  - **Decision:** Custom picker with categories - improves UX significantly for 50+ actions

## Open Questions

1. Should the JSON editor use Monaco (rich) or a simple textarea?
   - Recommendation: Start with styled textarea, upgrade to Monaco if users request syntax highlighting
