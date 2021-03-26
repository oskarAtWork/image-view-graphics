import { KeyMapping, NO_MODIFIERS } from '../data/keys';

export const griddingMappings: KeyMapping[] = [
  {
    key: 'ArrowDown',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_HIGHLIGHTED_DOWN',
  },
  {
    key: 'ArrowUp',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_HIGHLIGHTED_UP',
  },
  {
    key: 'ArrowLeft',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_HIGHLIGHTED_LEFT',
  },
  {
    key: 'ArrowRight',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_HIGHLIGHTED_RIGHT',
  },
];
