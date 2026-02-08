/**
 * Policy resource type definitions for the visual policy editor
 */

export interface ResourceType {
  id: string
  label: string
  description: string
  urnPattern: string
  placeholder: string
}

export const RESOURCE_TYPES: ResourceType[] = [
  {
    id: 'document',
    label: 'Document',
    description: 'Document resources',
    urnPattern: 'urn:revet:documents::document/{id}',
    placeholder: 'urn:revet:documents::document/*',
  },
  {
    id: 'organization',
    label: 'Organization',
    description: 'Organization resources',
    urnPattern: 'urn:revet:documents::organization/{id}',
    placeholder: 'urn:revet:documents::organization/*',
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Project resources',
    urnPattern: 'urn:revet:documents::project/{id}',
    placeholder: 'urn:revet:documents::project/*',
  },
  {
    id: 'bucket',
    label: 'Storage Bucket',
    description: 'Storage bucket resources',
    urnPattern: 'urn:revet:documents::bucket/{id}',
    placeholder: 'urn:revet:documents::bucket/*',
  },
  {
    id: 'user',
    label: 'User',
    description: 'User resources',
    urnPattern: 'urn:revet:iam::user/{id}',
    placeholder: 'urn:revet:iam::user/*',
  },
  {
    id: 'group',
    label: 'Group',
    description: 'Group resources',
    urnPattern: 'urn:revet:iam::group/{id}',
    placeholder: 'urn:revet:iam::group/*',
  },
]

export function getResourceTypeById(id: string): ResourceType | undefined {
  return RESOURCE_TYPES.find(r => r.id === id)
}

export function getResourceTypeFromUrn(urn: string): ResourceType | undefined {
  if (urn === '*') {
    return RESOURCE_TYPES.find(r => r.id === 'all')
  }

  // Match against URN patterns
  for (const resourceType of RESOURCE_TYPES) {
    if (resourceType.id === 'all') continue

    // Convert pattern to regex: urn:revet:documents::document/{id} -> urn:revet:documents::document/.*
    const pattern = resourceType.urnPattern.replace('{id}', '.*')
    const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\.\\*', '.*')}$`)

    if (regex.test(urn)) {
      return resourceType
    }
  }

  return undefined
}

export function getResourceLabel(urn: string): string {
  if (urn === '*') return 'All Resources'

  const resourceType = getResourceTypeFromUrn(urn)
  if (resourceType) {
    // Extract the ID from the URN if present
    const parts = urn.split('/')
    const id = parts[parts.length - 1]
    if (id === '*') {
      return `All ${resourceType.label}s`
    }
    return `${resourceType.label}: ${id}`
  }

  return urn
}
