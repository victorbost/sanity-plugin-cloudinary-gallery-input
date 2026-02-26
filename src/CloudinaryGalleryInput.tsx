import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ArrayOfObjectsInputProps, set, unset, PatchEvent, insert} from 'sanity'
import {Button, Card, Checkbox, Flex, Box, TextArea, TextInput, Text, Stack, Label} from '@sanity/ui'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {v4 as uuidv4} from 'uuid'
import type {CloudinaryOptions, GalleryFieldDescriptor, GalleryItem, GallerySchemaType, ImageData} from './types'
import {extractFieldDescriptors} from './utils/extractFields'

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

interface CloudinaryResult {
  event: string
  info: {
    secure_url?: string
    public_id?: string
    original_filename?: string
  }
}

type CloudinaryCallback = (error: Error | null, result: CloudinaryResult) => void

const createGalleryItem = (imageData: ImageData, fields: GalleryFieldDescriptor[]): GalleryItem => {
  const item: GalleryItem = {
    _key: uuidv4(),
    image: imageData,
  }
  const firstStringField = fields.find((f) => f.type === 'string' || f.type === 'url')
  if (firstStringField) {
    item[firstStringField.name] = imageData.original_filename.replace(/[-_]/g, ' ')
  }
  return item
}

const preserveContainerScroll = (container: HTMLElement | null, fn: () => void): void => {
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
  item: GalleryItem
  index: number
  fields: GalleryFieldDescriptor[]
  onChange: (event: PatchEvent) => void
  onRemove: (index: number) => void
  readOnly?: boolean
}

const SortableItem = React.memo(function SortableItem({
  item,
  index,
  fields,
  onChange,
  onRemove,
  readOnly,
}: SortableItemProps) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: item._key})

  const [localFields, setLocalFields] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const f of fields) {
      initial[f.name] = item[f.name] ?? (f.type === 'boolean' ? false : f.type === 'number' ? '' : '')
    }
    return initial
  })

  useEffect(() => {
    setLocalFields((prev) => {
      const updated: Record<string, unknown> = {...prev}
      for (const f of fields) {
        updated[f.name] = item[f.name] ?? (f.type === 'boolean' ? false : '')
      }
      return updated
    })
  }, [item, fields])

  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      const currentValue = localFields[fieldName]
      const storedValue = item[fieldName]
      if (currentValue === storedValue) return
      const patch =
        currentValue === '' || currentValue === undefined || currentValue === null
          ? PatchEvent.from([unset([{_key: item._key}, fieldName])])
          : PatchEvent.from([set(currentValue, [{_key: item._key}, fieldName])])
      onChange(patch)
    },
    [localFields, item, onChange]
  )

  const handleBooleanChange = useCallback(
    (fieldName: string, checked: boolean) => {
      setLocalFields((prev) => ({...prev, [fieldName]: checked}))
      onChange(PatchEvent.from([set(checked, [{_key: item._key}, fieldName])]))
    },
    [item._key, onChange]
  )

  const firstStringField = fields.find((f) => f.type === 'string' || f.type === 'url')
  const altText = firstStringField ? String(localFields[firstStringField.name] ?? '') : ''

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card padding={3} shadow={1} radius={2} marginBottom={2}>
        <Flex align="flex-start" gap={3}>
          <Box
            {...listeners}
            style={{
              cursor: readOnly ? 'default' : 'grab',
              paddingRight: 8,
              paddingTop: 4,
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
                src={item.image.secure_url as string}
                alt={altText}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )}
          </Box>
          <Box flex={1}>
            <Stack space={2}>
              {fields.map((field) => {
                if (field.type === 'boolean') {
                  return (
                    <Flex key={field.name} align="center" gap={2}>
                      <Checkbox
                        checked={Boolean(localFields[field.name])}
                        onChange={(e) =>
                          handleBooleanChange(field.name, (e.currentTarget as HTMLInputElement).checked)
                        }
                        disabled={readOnly}
                        id={`${item._key}-${field.name}`}
                      />
                      <Label htmlFor={`${item._key}-${field.name}`} size={1}>
                        {field.title}
                      </Label>
                    </Flex>
                  )
                }
                if (field.type === 'text') {
                  return (
                    <TextArea
                      key={field.name}
                      value={String(localFields[field.name] ?? '')}
                      onChange={(e) => {
                        const value = e.currentTarget.value
                        setLocalFields((prev) => ({...prev, [field.name]: value}))
                      }}
                      onBlur={() => handleFieldBlur(field.name)}
                      placeholder={field.placeholder ?? field.title}
                      rows={field.rows ?? 3}
                      readOnly={readOnly}
                    />
                  )
                }
                if (field.type === 'number') {
                  return (
                    <TextInput
                      key={field.name}
                      type="number"
                      value={String(localFields[field.name] ?? '')}
                      onChange={(e) => {
                        const value = e.currentTarget.value
                        setLocalFields((prev) => ({...prev, [field.name]: value}))
                      }}
                      onBlur={() => {
                        const raw = localFields[field.name]
                        const num = raw === '' ? undefined : Number(raw)
                        const stored = item[field.name]
                        if (num === stored) return
                        const patch =
                          num === undefined || isNaN(num as number)
                            ? PatchEvent.from([unset([{_key: item._key}, field.name])])
                            : PatchEvent.from([set(num, [{_key: item._key}, field.name])])
                        onChange(patch)
                      }}
                      placeholder={field.placeholder ?? field.title}
                      readOnly={readOnly}
                    />
                  )
                }
                // string and url
                return (
                  <TextInput
                    key={field.name}
                    value={String(localFields[field.name] ?? '')}
                    onChange={(e) => {
                      const value = e.currentTarget.value
                      setLocalFields((prev) => ({...prev, [field.name]: value}))
                    }}
                    onBlur={() => handleFieldBlur(field.name)}
                    placeholder={field.placeholder ?? field.title}
                    readOnly={readOnly}
                  />
                )
              })}
            </Stack>
          </Box>
          <Button
            tone="critical"
            text="Remove"
            onClick={() => onRemove(index)}
            disabled={readOnly}
          />
        </Flex>
      </Card>
    </div>
  )
})

export default function CloudinaryGalleryInput(props: ArrayOfObjectsInputProps<GalleryItem>) {
  const {value = [], onChange, schemaType, readOnly} = props
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const fields = useMemo(
    () => extractFieldDescriptors(schemaType as unknown as GallerySchemaType),
    [schemaType]
  )

  const options = (schemaType as unknown as GallerySchemaType)?.options?.cloudinary
  const resolvedConfig: CloudinaryOptions = {
    cloudName: options?.cloudName ?? '',
    uploadPreset: options?.uploadPreset ?? '',
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
    // No cleanup — the script is a global singleton shared across all instances
  }, [hasRequiredConfig])

  const handleRemove = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index)
      preserveContainerScroll(scrollContainerRef.current, () => {
        onChange(PatchEvent.from(set(updated)))
      })
    },
    [value, onChange]
  )

  const handleUpload = useCallback(() => {
    const cloudinaryWindow = window as unknown as CloudinaryWindow
    if (!cloudinaryWindow.cloudinary?.createUploadWidget) {
      console.error('Cloudinary widget not loaded yet.')
      return
    }
    const uploadedIds = new Set<string>()
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
          if (secure_url && public_id && original_filename && !uploadedIds.has(public_id)) {
            uploadedIds.add(public_id)
            const newItem = createGalleryItem({secure_url, public_id, original_filename}, fields)
            onChange(PatchEvent.from(insert([newItem], 'after', [-1])))
          }
        }
        if (result.event === 'batch-upload-complete') {
          widget.close()
        }
      }
    )
    widget.open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedConfig.cloudName, resolvedConfig.uploadPreset, fields, onChange])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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
    },
    [value, onChange]
  )

  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}))

  if (!hasRequiredConfig) {
    return (
      <Card padding={3} tone="caution">
        <Stack space={3}>
          <Text size={2} weight="semibold">
            Cloudinary configuration required
          </Text>
          <Text>
            Provide <code>schemaType.options.cloudinary</code> with at least{' '}
            <code>cloudName</code> and <code>uploadPreset</code>.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack space={4}>
      <div ref={scrollContainerRef} style={{marginBottom: '1rem'}}>
        {(!value || value.length === 0) && <Text muted>No images yet.</Text>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={value.map((item) => item._key)}
            strategy={verticalListSortingStrategy}
          >
            {value.map((item, index) => (
              <SortableItem
                key={item._key}
                item={item}
                index={index}
                fields={fields}
                onChange={onChange}
                onRemove={handleRemove}
                readOnly={readOnly}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Card padding={3}>
          <Button
            text="Upload Images"
            tone="primary"
            onClick={handleUpload}
            disabled={readOnly}
            style={{width: '100%'}}
          />
        </Card>
      </div>
    </Stack>
  )
}
