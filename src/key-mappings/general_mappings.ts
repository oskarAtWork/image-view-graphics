import { KeyMapping, NO_MODIFIERS } from '../data/keys';

export const generalKeyMappings: KeyMapping[] = [
  {
    key: 'ArrowUp',
    modifiers: { control: true, shift: true, alt: false },
    message: 'ZOOM_IN',
  },
  {
    key: 'ArrowDown',
    modifiers: { control: true, shift: true, alt: false },
    message: 'ZOOM_OUT',
  },
  {
    key: 'Enter',
    modifiers: NO_MODIFIERS,
    message: 'OPEN_BLOCK_VIEW',
  },
  {
    key: 'KeyH',
    modifiers: { control: true, alt: false, shift: false },
    message: 'TOGGLE_HELP',
  },
  {
    key: 'KeyS',
    modifiers: { control: true, alt: false, shift: false },
    message: 'SAVE_GRID',
  },
  {
    key: 'KeyY',
    modifiers: { control: true, alt: false, shift: false },
    message: 'TOGGLE_TOOLBAR',
  },
  { key: 'KeyR', modifiers: { control: true, alt: true, shift: false }, message: 'RESET_BLOCK' },
];
