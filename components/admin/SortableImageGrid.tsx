'use client';

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Box, Typography, IconButton, Chip, Button, Menu, MenuItem } from '@mui/material';
import { Delete, CloudUpload, DragIndicator, Palette, Check } from '@mui/icons-material';
import { useImageCropperBatch } from '../common/ImageCropperProvider';

export interface SortableImage {
  /** Stable identity: an existing image id, or `new:<n>` for a pending upload. */
  key: string;
  src: string;
  /** Pending uploads are outlined so the admin can tell them apart pre-save. */
  isNew?: boolean;
}

interface Props {
  images: SortableImage[];
  onReorder: (next: SortableImage[]) => void;
  onRemove: (key: string) => void;
  onAdd: (files: File[]) => void;
  /** Rendered under the grid; falls back to the standard hint. */
  helperText?: string;
  /**
   * Colour names from the product's variants. Empty hides the whole colour
   * control — a product with one colour has nothing to assign, and an empty
   * dropdown would only raise questions.
   */
  colorOptions?: string[];
  /** Current assignment per grid key; a missing or null entry means "default". */
  colorByKey?: Record<string, string | null>;
  onColorChange?: (key: string, color: string | null) => void;
}

/** Shown for an image that belongs to no particular colour. */
const DEFAULT_LABEL = 'All colours';

const TILE_W = 96;
const TILE_H = 128;

function SortableTile({ image, index, onRemove, colorOptions, color, onColorChange }: {
  image: SortableImage;
  index: number;
  onRemove: (key: string) => void;
  colorOptions: string[];
  color: string | null;
  onColorChange?: (key: string, color: string | null) => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.key });

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: 'relative',
        width: TILE_W,
        // The tile being dragged stays in the flow as a placeholder gap.
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          position: 'relative',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          borderRadius: 1,
          overflow: 'hidden',
          border: '2px solid',
          borderColor: image.isNew ? '#2e7d32' : index === 0 ? '#1a1a1a' : 'divider',
          borderStyle: image.isNew ? 'dashed' : 'solid',
          transition: 'border-color 0.2s',
          '&:hover .drag-hint': { opacity: 1 },
        }}
      >
        <Box
          component="img"
          src={image.src}
          alt=""
          draggable={false}
          sx={{ display: 'block', width: '100%', height: TILE_H, objectFit: 'cover' }}
        />

        {/* Position number — the whole point of the control, so it is always visible. */}
        <Box sx={{
          position: 'absolute', top: 4, left: 4,
          width: 20, height: 20, borderRadius: '50%',
          bgcolor: index === 0 ? '#1a1a1a' : 'rgba(0,0,0,0.62)',
          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {index + 1}
        </Box>

        <Box className="drag-hint" sx={{
          position: 'absolute', top: 4, right: 4, color: '#fff',
          opacity: 0, transition: 'opacity 0.2s',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
        }}>
          <DragIndicator sx={{ fontSize: 16 }} />
        </Box>

        {index === 0 && (
          <Chip label="Cover" size="small" sx={{
            position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
            fontSize: '0.55rem', height: 16, bgcolor: '#1a1a1a', color: '#fff',
          }} />
        )}
        {image.isNew && index !== 0 && (
          <Chip label="New" size="small" sx={{
            position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
            fontSize: '0.55rem', height: 16, bgcolor: '#e8f5e9', color: '#2e7d32',
          }} />
        )}
      </Box>

      {/* Outside the drag listeners, so a click here never starts a drag. */}
      <IconButton
        size="small"
        onClick={() => onRemove(image.key)}
        sx={{
          position: 'absolute', top: -8, right: -8, bgcolor: '#fff', boxShadow: 1,
          '&:hover': { bgcolor: '#ffebee' }, p: 0.25, color: '#d32f2f',
        }}
      >
        <Delete sx={{ fontSize: 14 }} />
      </IconButton>

      {/* Colour assignment. Deliberately below the image and outside the drag
          listeners, so opening it never starts a drag. */}
      {colorOptions.length > 0 && (
        <>
          <Box
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            title={color ? `Shown when "${color}" is selected` : 'Shown when the chosen colour has no images of its own'}
            sx={{
              mt: 0.5, px: 0.5, py: 0.25,
              display: 'flex', alignItems: 'center', gap: 0.25,
              border: '1px solid', borderColor: color ? '#1a1a1a' : '#e0e0e0',
              borderRadius: 0.5, cursor: 'pointer',
              bgcolor: color ? '#1a1a1a' : 'transparent',
              color: color ? '#fff' : '#777',
              '&:hover': { borderColor: '#1a1a1a' },
            }}
          >
            <Palette sx={{ fontSize: 12, flexShrink: 0 }} />
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.02em',
              textTransform: 'capitalize', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {color || DEFAULT_LABEL}
            </Typography>
          </Box>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => { onColorChange?.(image.key, null); setMenuAnchor(null); }}
              sx={{ fontSize: '0.8rem' }}
            >
              {!color && <Check sx={{ fontSize: 14, mr: 0.75 }} />}
              <Box component="span" sx={{ ml: color ? '22px' : 0 }}>{DEFAULT_LABEL}</Box>
            </MenuItem>
            {colorOptions.map((option) => (
              <MenuItem
                key={option}
                onClick={() => { onColorChange?.(image.key, option); setMenuAnchor(null); }}
                sx={{ fontSize: '0.8rem', textTransform: 'capitalize' }}
              >
                {color === option && <Check sx={{ fontSize: 14, mr: 0.75 }} />}
                <Box component="span" sx={{ ml: color === option ? 0 : '22px' }}>{option}</Box>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
}

export default function SortableImageGrid({
  images, onReorder, onRemove, onAdd, helperText,
  colorOptions = [], colorByKey = {}, onColorChange,
}: Props) {
  const cropImages = useImageCropperBatch();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const sensors = useSensors(
    // A small threshold so the delete button and the file picker still take
    // plain clicks rather than being swallowed as micro-drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveKey(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex(i => i.key === active.id);
    const newIndex = images.findIndex(i => i.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(images, oldIndex, newIndex));
  };

  const activeImage = images.find(i => i.key === activeKey);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: DragStartEvent) => setActiveKey(e.active.id as string)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveKey(null)}
      >
        <SortableContext items={images.map(i => i.key)} strategy={rectSortingStrategy}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            {images.map((image, index) => (
              <SortableTile
                key={image.key}
                image={image}
                index={index}
                onRemove={onRemove}
                colorOptions={colorOptions}
                color={colorByKey[image.key] ?? null}
                onColorChange={onColorChange}
              />
            ))}

            <Button component="label" variant="outlined" sx={{
              width: TILE_W, height: TILE_H, borderRadius: 1, borderStyle: 'dashed',
              flexDirection: 'column', gap: 0.5, flexShrink: 0,
            }}>
              <CloudUpload fontSize="small" />
              <Typography variant="caption">Add</Typography>
              <input
                type="file" hidden accept="image/*" multiple
                onChange={async (e) => {
                  const picked = Array.from(e.target.files || []);
                  // Reset so picking the same file twice still fires onChange.
                  e.target.value = '';
                  if (!picked.length) return;
                  onAdd(await cropImages(picked, 'product'));
                }}
              />
            </Button>
          </Box>
        </SortableContext>

        {/* Follows the cursor at full opacity while the source tile dims. */}
        <DragOverlay>
          {activeImage ? (
            <Box
              component="img"
              src={activeImage.src}
              alt=""
              sx={{
                width: TILE_W, height: TILE_H, objectFit: 'cover',
                borderRadius: 1, boxShadow: 6, cursor: 'grabbing',
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Typography variant="caption" color="text.secondary">
        {helperText ?? 'Drag to reorder — image 1 is the cover shown on listings and first in the gallery.'}
      </Typography>
    </>
  );
}
