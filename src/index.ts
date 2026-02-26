import {definePlugin} from 'sanity'
import CloudinaryGalleryInput from './CloudinaryGalleryInput'

export const cloudinaryGalleryInput = definePlugin(() => ({
  name: 'sanity-plugin-cloudinary-gallery-input',
}))

export {CloudinaryGalleryInput}
export type {CloudinaryOptions, GalleryItem, GalleryFieldDescriptor, ImageData} from './types'
export {defineCloudinaryGalleryField} from './utils/defineCloudinaryGalleryField'
export type {CloudinaryGalleryFieldOptions, DefineCloudinaryGalleryFieldConfig} from './utils/defineCloudinaryGalleryField'
