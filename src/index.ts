import {definePlugin} from 'sanity'
import CloudinaryGalleryInput from './CloudinaryGalleryInput'

export const cloudinaryGalleryInput = definePlugin(() => ({
  name: 'sanity-plugin-cloudinary-gallery-input',
}))

export {CloudinaryGalleryInput}
