import type {ComponentType} from 'react'
import {defineField} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'
import CloudinaryGalleryInput from '../CloudinaryGalleryInput'
import type {CloudinaryOptions} from '../types'

export interface CloudinaryGalleryFieldOptions {
  cloudinary: Pick<CloudinaryOptions, 'cloudName' | 'uploadPreset'> &
    Partial<Omit<CloudinaryOptions, 'cloudName' | 'uploadPreset'>>
}

export interface DefineCloudinaryGalleryFieldConfig {
  name: string
  title?: string
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  of: any[]
  options: CloudinaryGalleryFieldOptions
  hidden?: boolean
  readOnly?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation?: any
}

/**
 * Typed wrapper around `defineField` for the Cloudinary gallery input.
 * Automatically injects the component and types `options.cloudinary` —
 * no `as any` needed in your schema file.
 *
 * @example
 * ```ts
 * defineCloudinaryGalleryField({
 *   name: 'gallery',
 *   title: 'Gallery',
 *   of: [{ type: 'object', fields: [...] }],
 *   options: {
 *     cloudinary: { cloudName: 'my-cloud', uploadPreset: 'my-preset' },
 *   },
 * })
 * ```
 */
export function defineCloudinaryGalleryField(config: DefineCloudinaryGalleryFieldConfig) {
  const {options, ...rest} = config
  return defineField({
    ...rest,
    type: 'array',
    components: {
      input: CloudinaryGalleryInput as ComponentType<ArrayOfObjectsInputProps<any>>,
    },
    options: options as unknown as Record<string, unknown>,
  } as Parameters<typeof defineField>[0])
}
