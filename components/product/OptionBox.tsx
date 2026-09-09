'use client';
import { Box } from '@mui/material';

/**
 * A selectable option box — the single control used for both colour and size
 * on the product page.
 *
 * Colour was previously a round swatch filled from a hex derived from the
 * colour NAME on the server. That derivation is lossy in a way that shows:
 * a product with two distinct colours rendered as two identical blue circles,
 * so the customer could not tell the options apart, and the only way to read
 * a colour was to hover for a tooltip — which a phone cannot do at all.
 *
 * The name in a box is legible on every device, needs no mapping table, and
 * matches the size selector, so the two rows of controls finally read as one
 * system.
 */
interface Props {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Names need more room than sizes; also capitalises the label. */
  wide?: boolean;
}

export default function OptionBox({ label, selected = false, disabled = false, onClick, wide = false }: Props) {
  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={() => !disabled && onClick?.()}
      onKeyDown={(e) => {
        if (disabled) return;
        // Boxes are not native buttons, so the keyboard contract has to be
        // spelled out or the selector is mouse-only.
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        minWidth: wide ? 72 : 44,
        // Colour names come from the database. Without a ceiling and an ellipsis
        // a "Midnight Navy Blue" paints straight past the right page edge, since
        // the label is nowrap. 100% keeps it inside whatever row it lands in.
        maxWidth: '100%',
        overflow: 'hidden',
        height: 44,
        px: wide ? 2 : 1.5,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid',
        borderColor: selected ? '#1a1a1a' : '#e0e0e0',
        borderRadius: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        bgcolor: selected ? '#1a1a1a' : 'transparent',
        color: selected ? '#fff' : '#1a1a1a',
        fontWeight: 600,
        fontSize: '0.8rem',
        letterSpacing: '0.02em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        textTransform: wide ? 'capitalize' : 'none',
        transition: 'border-color 0.2s, background-color 0.2s, color 0.2s',
        userSelect: 'none',
        '&:hover': disabled ? {} : { borderColor: '#1a1a1a' },
        '&:focus-visible': { outline: '2px solid #c9a84c', outlineOffset: 2 },
      }}
    >
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {label}
      </Box>
    </Box>
  );
}
