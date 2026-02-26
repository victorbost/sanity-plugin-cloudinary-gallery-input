import type {GalleryFieldDescriptor, GallerySchemaType, SupportedFieldType} from '../types'

const SUPPORTED_TYPES = new Set<string>(['string', 'text', 'number', 'boolean', 'url'])

const FALLBACK_FIELDS: GalleryFieldDescriptor[] = [
  {name: 'title', title: 'Title', type: 'string', placeholder: 'Title'},
  {name: 'legend', title: 'Caption', type: 'string', placeholder: 'Caption'},
]

function getTypeName(field: {type: {name: string} | string}): string {
  if (typeof field.type === 'string') return field.type
  return field.type?.name ?? ''
}

export function extractFieldDescriptors(schemaType: GallerySchemaType): GalleryFieldDescriptor[] {
  try {
    const fields = schemaType?.of?.[0]?.fields
    if (!fields) return FALLBACK_FIELDS
    const descriptors: GalleryFieldDescriptor[] = fields
      .filter((f) => f.name !== 'image' && SUPPORTED_TYPES.has(getTypeName(f)))
      .map((f) => ({
        name: f.name,
        title: f.title ?? f.name,
        type: getTypeName(f) as SupportedFieldType,
        placeholder: f.title ?? f.name,
      }))
    return descriptors.length > 0 ? descriptors : FALLBACK_FIELDS
  } catch {
    return FALLBACK_FIELDS
  }
}
