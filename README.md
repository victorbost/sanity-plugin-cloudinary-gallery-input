# batch-upload-sanity-plugin-cloudinary

A Sanity Studio input component for batch uploading and managing Cloudinary images with drag-and-drop ordering and fully dynamic, schema-driven fields.

## Features

- **Batch Upload**: Upload multiple images at once using Cloudinary's upload widget
- **Drag & Drop Reordering**: Reorder images with intuitive drag-and-drop functionality
- **Dynamic Fields**: Automatically renders inputs for any fields declared in your schema — no plugin config needed
- **Multiple Input Types**: Supports `string`, `text`, `number`, `boolean`, and `url` field types
- **Easy Removal**: Remove individual images from the gallery
- **Configurable**: Customize upload settings via schema options
- **Responsive**: Works on desktop and mobile devices

## Installation

```bash
npm install batch-upload-sanity-plugin-cloudinary
# or
pnpm add batch-upload-sanity-plugin-cloudinary
# or
yarn add batch-upload-sanity-plugin-cloudinary
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
import {CloudinaryGalleryInput} from 'batch-upload-sanity-plugin-cloudinary'
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
      } as any,
    }),
  ],
}
```

## Custom Fields

The plugin reads your `of[0].fields` schema declaration at runtime and renders inputs automatically — no extra configuration required. Any fields you define (other than `image`) will appear as editable inputs in the gallery UI.

**Supported field types:** `string` → TextInput, `text` → TextArea, `number` → number TextInput, `boolean` → Checkbox, `url` → TextInput

**Fallback:** If no supported fields are found, the plugin falls back to rendering `title` and `legend` text inputs, preserving backwards compatibility with existing schemas.

### Example: Multi-field schema

```ts
defineField({
  name: 'portfolio',
  title: 'Portfolio',
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        defineField({name: 'image', type: 'cloudinary.asset'}),
        defineField({name: 'altText',  title: 'Alt Text',  type: 'string'}),
        defineField({name: 'caption',  title: 'Caption',   type: 'text'}),
        defineField({name: 'year',     title: 'Year',      type: 'number'}),
        defineField({name: 'featured', title: 'Featured',  type: 'boolean'}),
      ],
    },
  ],
  components: {input: CloudinaryGalleryInput as ComponentType<ArrayOfObjectsInputProps<any>>},
  options: {
    cloudinary: {
      cloudName: 'my-cloud',
      uploadPreset: 'portfolio-uploads',
    }
  } as any,
})
```

This renders four inputs per image: an Alt Text text input, a Caption textarea, a Year number input, and a Featured checkbox.

## Configuration Options

The `options.cloudinary` object accepts the following properties:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `cloudName` | `string` | Yes | — | Your Cloudinary cloud name |
| `uploadPreset` | `string` | Yes | — | Your Cloudinary upload preset |
| `multiple` | `boolean` | No | `true` | Allow multiple file uploads |
| `sources` | `string[]` | No | `['local', 'url', 'camera', 'dropbox']` | Available upload sources |
| `resourceType` | `string` | No | `'image'` | Type of resources to upload |
| `maxFiles` | `number` | No | `20` | Maximum number of files |
| `folder` | `string` | No | `''` | Cloudinary folder path |

## Data Structure

Each gallery item is stored as:

```ts
interface GalleryItem {
  _key: string
  image: {
    secure_url: string
    public_id: string
    original_filename: string
  }
  [fieldName: string]: unknown  // your custom fields
}
```

## Cloudinary Setup

1. **Create an Upload Preset**:
   - Go to your Cloudinary dashboard
   - Navigate to Settings → Upload
   - Create a new unsigned upload preset
   - Configure allowed formats, transformations, etc.

2. **Configure Security**:
   - Use unsigned upload presets for client-side uploads
   - Set appropriate folder restrictions
   - Configure allowed file types and sizes

## Development

```bash
# Clone the repository
git clone https://github.com/victorbost/sanity-plugin-cloudinary-gallery-input.git
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

## Releasing

This project uses [release-it](https://github.com/release-it/release-it) with conventional changelog to automate version bumps, CHANGELOG generation, git tagging, and GitHub Releases. Publishing to npm is handled automatically by GitHub Actions when a GitHub Release is created.

```bash
GITHUB_TOKEN=<your-token> npm run release
# Interactive: choose patch / minor / major
# Automatically: bumps package.json, updates CHANGELOG.md, commits, tags, pushes, creates GitHub Release
# Then: GitHub Actions picks up the release event and publishes to npm
```

To preview what would happen without making any changes:

```bash
GITHUB_TOKEN=<your-token> npm run release -- --dry-run
```

## Dependencies

### Peer Dependencies
- `react` >= 18
- `react-dom` >= 18
- `sanity` >= 3
- `@sanity/ui` >= 1
- `@dnd-kit/core` >= 6
- `@dnd-kit/sortable` >= 7
- `@dnd-kit/utilities` >= 3
- `uuid` >= 9

### Required Sanity Plugin
- `sanity-plugin-cloudinary` — Official Cloudinary integration for Sanity

## Troubleshooting

### Common Issues

1. **"Cloudinary configuration required" message**:
   - Ensure you've added the `options.cloudinary` configuration
   - Verify your `cloudName` and `uploadPreset` are correct

2. **TypeScript errors with custom options**:
   - Use `as any` type assertion for the options object, or import `CloudinaryOptions` from the package

3. **Upload widget not loading**:
   - Check your Cloudinary upload preset is unsigned
   - Verify your cloud name is correct

4. **Drag and drop not working**:
   - Ensure all `@dnd-kit` dependencies are installed
   - Check that the component is not in read-only mode

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Victor Bostaetter

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/victorbost/batch-upload-sanity-plugin-cloudinary/issues) on GitHub.
