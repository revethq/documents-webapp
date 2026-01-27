/**
 * Policy action definitions for the Revet Documents system.
 * Actions follow the pattern: documents:{ActionName}
 */

const SERVICE = 'documents'

export interface ActionCategory {
  name: string
  description: string
  actions: ActionDefinition[]
}

export interface ActionDefinition {
  action: string
  label: string
  description: string
}

export const ORGANIZATION_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListOrganizations`, label: 'List Organizations', description: 'View all organizations' },
  { action: `${SERVICE}:GetOrganization`, label: 'Get Organization', description: 'View organization details' },
  { action: `${SERVICE}:CreateOrganization`, label: 'Create Organization', description: 'Create new organizations' },
  { action: `${SERVICE}:UpdateOrganization`, label: 'Update Organization', description: 'Modify organization settings' },
  { action: `${SERVICE}:DeleteOrganization`, label: 'Delete Organization', description: 'Remove organizations' },
]

export const PROJECT_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListProjects`, label: 'List Projects', description: 'View all projects' },
  { action: `${SERVICE}:GetProject`, label: 'Get Project', description: 'View project details' },
  { action: `${SERVICE}:CreateProject`, label: 'Create Project', description: 'Create new projects' },
  { action: `${SERVICE}:UpdateProject`, label: 'Update Project', description: 'Modify project settings' },
  { action: `${SERVICE}:DeleteProject`, label: 'Delete Project', description: 'Remove projects' },
  { action: `${SERVICE}:AddProjectClient`, label: 'Add Project Client', description: 'Add clients to projects' },
  { action: `${SERVICE}:RemoveProjectClient`, label: 'Remove Project Client', description: 'Remove clients from projects' },
  { action: `${SERVICE}:AddProjectTag`, label: 'Add Project Tag', description: 'Add tags to projects' },
  { action: `${SERVICE}:RemoveProjectTag`, label: 'Remove Project Tag', description: 'Remove tags from projects' },
]

export const DOCUMENT_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListDocuments`, label: 'List Documents', description: 'View all documents' },
  { action: `${SERVICE}:GetDocument`, label: 'Get Document', description: 'View document details' },
  { action: `${SERVICE}:CreateDocument`, label: 'Create Document', description: 'Create new documents' },
  { action: `${SERVICE}:UpdateDocument`, label: 'Update Document', description: 'Modify document metadata' },
  { action: `${SERVICE}:DeleteDocument`, label: 'Delete Document', description: 'Remove documents' },
  { action: `${SERVICE}:DownloadDocument`, label: 'Download Document', description: 'Download document files' },
  { action: `${SERVICE}:AddDocumentTag`, label: 'Add Document Tag', description: 'Add tags to documents' },
  { action: `${SERVICE}:RemoveDocumentTag`, label: 'Remove Document Tag', description: 'Remove tags from documents' },
]

export const DOCUMENT_VERSION_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListDocumentVersions`, label: 'List Versions', description: 'View all document versions' },
  { action: `${SERVICE}:GetDocumentVersion`, label: 'Get Version', description: 'View version details' },
  { action: `${SERVICE}:CreateDocumentVersion`, label: 'Create Version', description: 'Create new document versions' },
  { action: `${SERVICE}:UpdateDocumentVersion`, label: 'Update Version', description: 'Modify version metadata' },
  { action: `${SERVICE}:DeleteDocumentVersion`, label: 'Delete Version', description: 'Remove document versions' },
  { action: `${SERVICE}:CompleteDocumentUpload`, label: 'Complete Upload', description: 'Complete document upload process' },
]

export const CATEGORY_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListCategories`, label: 'List Categories', description: 'View all categories' },
  { action: `${SERVICE}:GetCategory`, label: 'Get Category', description: 'View category details' },
  { action: `${SERVICE}:CreateCategory`, label: 'Create Category', description: 'Create new categories' },
  { action: `${SERVICE}:UpdateCategory`, label: 'Update Category', description: 'Modify category settings' },
  { action: `${SERVICE}:DeleteCategory`, label: 'Delete Category', description: 'Remove categories' },
]

export const TAG_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListTags`, label: 'List Tags', description: 'View all tags' },
  { action: `${SERVICE}:GetTag`, label: 'Get Tag', description: 'View tag details' },
  { action: `${SERVICE}:CreateTag`, label: 'Create Tag', description: 'Create new tags' },
  { action: `${SERVICE}:UpdateTag`, label: 'Update Tag', description: 'Modify tag settings' },
  { action: `${SERVICE}:DeleteTag`, label: 'Delete Tag', description: 'Remove tags' },
]

export const BUCKET_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListBuckets`, label: 'List Buckets', description: 'View all storage buckets' },
  { action: `${SERVICE}:GetBucket`, label: 'Get Bucket', description: 'View bucket details' },
  { action: `${SERVICE}:CreateBucket`, label: 'Create Bucket', description: 'Create new storage buckets' },
  { action: `${SERVICE}:UpdateBucket`, label: 'Update Bucket', description: 'Modify bucket settings' },
  { action: `${SERVICE}:DeleteBucket`, label: 'Delete Bucket', description: 'Remove storage buckets' },
]

export const USER_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:ListUsers`, label: 'List Users', description: 'View all users' },
  { action: `${SERVICE}:GetUser`, label: 'Get User', description: 'View user details' },
  { action: `${SERVICE}:CreateUser`, label: 'Create User', description: 'Create new users' },
  { action: `${SERVICE}:UpdateUser`, label: 'Update User', description: 'Modify user settings' },
  { action: `${SERVICE}:DeleteUser`, label: 'Delete User', description: 'Remove users' },
]

export const FILE_UPLOAD_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:InitiateUpload`, label: 'Initiate Upload', description: 'Start file upload process' },
  { action: `${SERVICE}:GetDownloadUrl`, label: 'Get Download URL', description: 'Get presigned download URLs' },
  { action: `${SERVICE}:CreateVersionWithUrl`, label: 'Create Version with URL', description: 'Create version from external URL' },
]

export const SEARCH_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:SearchDocuments`, label: 'Search Documents', description: 'Search across documents' },
]

export const WILDCARD_ACTIONS: ActionDefinition[] = [
  { action: `${SERVICE}:*`, label: 'All Documents Actions', description: 'All actions in the Documents service' },
  { action: '*', label: 'Global Wildcard', description: 'All actions across all services' },
]

export const ACTION_CATEGORIES: ActionCategory[] = [
  { name: 'Organization', description: 'Organization management actions', actions: ORGANIZATION_ACTIONS },
  { name: 'Project', description: 'Project management actions', actions: PROJECT_ACTIONS },
  { name: 'Document', description: 'Document management actions', actions: DOCUMENT_ACTIONS },
  { name: 'Document Version', description: 'Document version actions', actions: DOCUMENT_VERSION_ACTIONS },
  { name: 'Category', description: 'Category management actions', actions: CATEGORY_ACTIONS },
  { name: 'Tag', description: 'Tag management actions', actions: TAG_ACTIONS },
  { name: 'Bucket', description: 'Storage bucket actions', actions: BUCKET_ACTIONS },
  { name: 'User', description: 'User management actions', actions: USER_ACTIONS },
  { name: 'File Upload', description: 'File upload actions', actions: FILE_UPLOAD_ACTIONS },
  { name: 'Search', description: 'Search actions', actions: SEARCH_ACTIONS },
  { name: 'Wildcards', description: 'Wildcard actions for broad permissions', actions: WILDCARD_ACTIONS },
]

export const ALL_ACTIONS: ActionDefinition[] = ACTION_CATEGORIES.flatMap(cat => cat.actions)

export function getActionLabel(action: string): string {
  const found = ALL_ACTIONS.find(a => a.action === action)
  return found?.label ?? action
}

export function getActionsByCategory(categoryName: string): ActionDefinition[] {
  const category = ACTION_CATEGORIES.find(c => c.name === categoryName)
  return category?.actions ?? []
}
