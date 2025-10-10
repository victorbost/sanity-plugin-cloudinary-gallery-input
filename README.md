# sanity-plugin-cloudinary-gallery-input

A Sanity Studio input component for batch uploading and managing Cloudinary images with titles/captions and drag-and-drop ordering.

## Features

- 🚀 **Batch Upload**: Upload multiple images at once using Cloudinary's upload widget
- 🎯 **Drag & Drop Reordering**: Reorder images with intuitive drag-and-drop functionality
- 📝 **Titles & Captions**: Add titles and captions to each image
- 🗑️ **Easy Removal**: Remove individual images from the gallery
- ⚙️ **Configurable**: Customize upload settings via schema options
- 📱 **Responsive**: Works on desktop and mobile devices

## Installation

```bash
npm install sanity-plugin-cloudinary-gallery-input
# or
pnpm add sanity-plugin-cloudinary-gallery-input
# or
yarn add sanity-plugin-cloudinary-gallery-input
```

## Prerequisites

This plugin requires the official Sanity Cloudinary plugin to be installed and configured:

```bash
npm install sanity-plugin-cloudinary
```

## Setup

### 1. Configure Sanity with Cloudinary

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {cloudinaryAssetSourcePlugin, cloudinarySchemaPlugin} from 'sanity-plugin-cloudinary'

export default defineConfig({
  name: 'default',
  title: 'My Studio',
  projectId: 'your-project-id',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    cloudinaryAssetSourcePlugin(),
    cloudinarySchemaPlugin()
  ],

  schema: {
    types: schemaTypes,
  },
})
```

### 2. Use the Component in Your Schema

```ts
// schemaTypes/album.ts
import {CloudinaryGalleryInput} from 'sanity-plugin-cloudinary-gallery-input'
import {defineField} from 'sanity'
import type {ComponentType} from 'react'
import type {ArrayOfObjectsInputProps} from 'sanity'

export default {
  name: 'album',
  title: 'Album',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'imagesWithLegend',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          name: 'imageWithLegend',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'cloudinary.asset',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'legend',
              title: 'Legend',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'legend',
              media: 'image',
            },
          },
        },
      ],
      components: {
        input: CloudinaryGalleryInput as ComponentType<ArrayOfObjectsInputProps<any>>,
      },
      options: {
        cloudinary: {
          cloudName: 'your-cloudinary-cloud-name',
          uploadPreset: 'your-upload-preset',
          multiple: true,
          sources: ['local', 'url', 'camera', 'dropbox'],
          resourceType: 'image',
          maxFiles: 20,
          folder: 'your-folder-path',
        }
      } as any, // Type assertion for custom options
    }),
  ],
}
```

## Configuration Options

The `options.cloudinary` object accepts the following properties:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `cloudName` | `string` | ✅ | - | Your Cloudinary cloud name |
| `uploadPreset` | `string` | ✅ | - | Your Cloudinary upload preset |
| `multiple` | `boolean` | ❌ | `true` | Allow multiple file uploads |
| `sources` | `string[]` | ❌ | `['local', 'url', 'camera', 'dropbox']` | Available upload sources |
| `resourceType` | `string` | ❌ | `'image'` | Type of resources to upload |
| `maxFiles` | `number` | ❌ | `20` | Maximum number of files |
| `folder` | `string` | ❌ | `''` | Cloudinary folder path |

## Cloudinary Setup

1. **Create an Upload Preset**:
   - Go to your Cloudinary dashboard
   - Navigate to Settings → Upload
   - Create a new unsigned upload preset
   - Configure allowed formats, transformations, etc.

2. **Configure Security**:
   - Use unsigned upload presets for security
   - Set appropriate folder restrictions
   - Configure allowed file types and sizes

## Data Structure

The component stores data in the following format:

```ts
interface ImageWithLegend {
  _key: string
  image: {
    secure_url: string
    public_id: string
    original_filename: string
  }
  title?: string
  legend?: string
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/victorbostaetter/sanity-plugin-cloudinary-gallery-input.git
cd sanity-plugin-cloudinary-gallery-input

# Install dependencies
npm install

# Start development mode
npm run dev
```

## Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Victor Bostaetter

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/victorbostaetter/sanity-plugin-cloudinary-gallery-input/issues) on GitHub.
