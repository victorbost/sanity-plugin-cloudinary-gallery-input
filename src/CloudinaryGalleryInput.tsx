import React, {useEffect, useRef, useState} from 'react'
import {ArrayOfObjectsInputProps, set, PatchEvent, FormField, insert} from 'sanity'
import {Button, Card, Flex, Box, TextInput, Text, Stack} from '@sanity/ui'
import {DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent} from '@dnd-kit/core'
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {v4 as uuidv4} from 'uuid'

interface CloudinaryWidget {
  open: () => void
  close: () => void
}

interface CloudinaryWindow extends Window {
  cloudinary?: {
    createUploadWidget: (
      options: CloudinaryOptions,
      callback: CloudinaryCallback
    ) => CloudinaryWidget
  }
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

interface CloudinaryResult {
  event: string
  info: {
    secure_url?: string
    public_id?: string
    original_filename?: string
    files?: Array<{
      secure_url: string
      public_id: string
      original_filename: string
    }>
  }
}

type CloudinaryCallback = (
  error: Error | null,
  result: CloudinaryResult
) => void

interface ImageData {
  secure_url: string
  public_id: string
  original_filename: string
}

export interface ImageWithLegend {
  _key: string
  image: ImageData
  legend?: string
  title?: string
}

const createImageItem = (imageData: ImageData): ImageWithLegend => ({
  _key: uuidv4(),
  image: imageData,
  legend: imageData.original_filename.replace(/[-_]/g, ' '),
})

const preserveContainerScroll = (
  container: HTMLElement | null,
  fn: () => void
): void => {
  if (!container) {
    fn()
    return
  }
  const scrollTop = container.scrollTop
  fn()
  requestAnimationFrame(() => {
    if (container) {
      container.scrollTop = scrollTop
    }
  })
}

interface SortableItemProps {
  item: ImageWithLegend
  index: number
  onChange: (event: PatchEvent) => void
  onRemove: (index: number) => void
  readOnly?: boolean
}

function SortableItem({item, index, onChange, onRemove, readOnly}: SortableItemProps) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: item._key})

  const [localValue, setLocalValue] = useState(item.legend ?? '')
  const [localTitle, setLocalTitle] = useState(item.title ?? '')

  useEffect(() => {
    setLocalValue(item.legend ?? '')
  }, [item.legend])

  useEffect(() => {
    setLocalTitle(item.title ?? '')
  }, [item.title])

  const handleBlur = () => {
    if (localValue !== item.legend) {
      const patch = PatchEvent.from([set(localValue, [{_key: item._key}, 'legend'])])
      onChange(patch)
    }
  }

  const handleTitleBlur = () => {
    if (localTitle !== item.title) {
      const patch = PatchEvent.from([set(localTitle, [{_key: item._key}, 'title'])])
      onChange(patch)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card padding={3} shadow={1} radius={2} marginBottom={2}>
        <Flex align="center" gap={3}>
          <Box
            {...listeners}
            style={{
              cursor: readOnly ? 'default' : 'grab',
              paddingRight: 8,
              fontSize: '1.5rem',
              lineHeight: '1',
              userSelect: 'none',
            }}
            aria-label="Drag to reorder"
          >
            ☰
          </Box>
          <Box
            style={{
              width: 60,
              height: 60,
              backgroundColor: '#f0f0f0',
              borderRadius: 4,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {item.image?.secure_url && (
              <img
                src={item.image.secure_url}
                alt={item.title || item.legend || ''}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )}
          </Box>
          <Box flex={1}>
            <Stack space={2}>
              <TextInput
                value={localTitle}
                onChange={(e) => setLocalTitle(e.currentTarget.value)}
                onBlur={handleTitleBlur}
                placeholder="Title"
                readOnly={readOnly}
              />
              <TextInput
                value={localValue}
                onChange={(e) => setLocalValue(e.currentTarget.value)}
                onBlur={handleBlur}
                placeholder="Caption"
                readOnly={readOnly}
              />
            </Stack>
          </Box>
          <Button tone="critical" text="Remove" onClick={() => onRemove(index)} disabled={readOnly} />
        </Flex>
      </Card>
    </div>
  )
}

export default function CloudinaryGalleryInput(
  props: ArrayOfObjectsInputProps<ImageWithLegend>
) {
  const {value = [], onChange, schemaType, readOnly} = props
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const options = (schemaType as any)?.options?.cloudinary as Partial<CloudinaryOptions> | undefined
  const resolvedConfig: CloudinaryOptions = {
    cloudName: options?.cloudName || '',
    uploadPreset: options?.uploadPreset || '',
    multiple: options?.multiple ?? true,
    sources: options?.sources ?? ['local', 'url', 'camera', 'dropbox'],
    resourceType: options?.resourceType ?? 'image',
    maxFiles: options?.maxFiles ?? 20,
    folder: options?.folder ?? '',
  }

  const hasRequiredConfig = Boolean(resolvedConfig.cloudName && resolvedConfig.uploadPreset)

  useEffect(() => {
    if (!hasRequiredConfig) return
    const existingScript = document.getElementById('cloudinary-widget')
    if (existingScript) return
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.id = 'cloudinary-widget'
    script.async = true
    document.body.appendChild(script)
    return () => {
      const scriptToRemove = document.getElementById('cloudinary-widget')
      if (scriptToRemove && scriptToRemove.parentElement) {
        scriptToRemove.parentElement.removeChild(scriptToRemove)
      }
    }
  }, [hasRequiredConfig])

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index)
    preserveContainerScroll(scrollContainerRef.current, () => {
      onChange(PatchEvent.from(set(updated)))
    })
  }

  const handleUpload = () => {
    const cloudinaryWindow = window as unknown as CloudinaryWindow
    if (!cloudinaryWindow.cloudinary?.createUploadWidget) {
      console.error('Cloudinary widget not loaded yet.')
      return
    }
    const widget = cloudinaryWindow.cloudinary.createUploadWidget(
      resolvedConfig,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          return
        }
        if (!result) return
        if (result.event === 'success' && result.info) {
          const {secure_url, public_id, original_filename} = result.info
          if (secure_url && public_id && original_filename) {
            const newItem = createImageItem({secure_url, public_id, original_filename})
            onChange(PatchEvent.from(insert([newItem], 'after', [-1])))
          }
        }
        if (result.event === 'batch-upload-complete' && result.info.files) {
          const uploadedItems = result.info.files.map((file) =>
            createImageItem({
              secure_url: file.secure_url,
              public_id: file.public_id,
              original_filename: file.original_filename,
            })
          )
          onChange(PatchEvent.from(insert(uploadedItems, 'after', [-1])))
          widget.close()
        }
      }
    )
    widget.open()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return
    const oldIndex = value.findIndex((i) => i._key === active.id)
    const newIndex = value.findIndex((i) => i._key === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(value, oldIndex, newIndex)
      preserveContainerScroll(scrollContainerRef.current, () => {
        onChange(PatchEvent.from(set(reordered)))
      })
    }
  }

  const sensors = useSensors(useSensor(PointerSensor))

  if (!hasRequiredConfig) {
    return (
      <Card padding={3} tone="caution">
        <Stack space={3}>
          <Text size={2} weight="semibold">Cloudinary configuration required</Text>
          <Text>
            Provide <code>schemaType.options.cloudinary</code> with at least <code>cloudName</code> and <code>uploadPreset</code>.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack space={4}>
      <div ref={scrollContainerRef} style={{marginBottom: '1rem'}}>
        {(!value || value.length === 0) && <Text muted>No images with legends yet.</Text>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.map((item) => item._key)} strategy={verticalListSortingStrategy}>
            {value.map((item, index) => (
              <SortableItem
                key={item._key}
                item={item}
                index={index}
                onChange={onChange}
                onRemove={handleRemove}
                readOnly={readOnly}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Card padding={3}>
          <Button text="Upload Images" tone="primary" onClick={handleUpload} disabled={readOnly} style={{width: '100%'}} />
        </Card>
      </div>
    </Stack>
  )
}
