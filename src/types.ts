export type SupportedFieldType = 'string' | 'text' | 'number' | 'boolean' | 'url'

export interface GalleryFieldDescriptor {
  name: string
  title: string
  type: SupportedFieldType
  rows?: number
  placeholder?: string
}

export interface ImageData {
  secure_url: string
  public_id: string
  original_filename: string
}

export interface GalleryItem {
  _key: string
  image: ImageData
  [fieldName: string]: unknown
}

export interface CloudinaryOptions {
  cloudName: string
  uploadPreset: string
  multiple?: boolean
  sources?: string[]
  resourceType?: string
  maxFiles?: number
  folder?: string
}

export interface GallerySchemaType {
  options?: {cloudinary?: Partial<CloudinaryOptions>}
  of?: Array<{fields?: Array<{name: string; title?: string; type: {name: string} | string}>}>
}
