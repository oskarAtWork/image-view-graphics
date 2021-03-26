import { KeyMapping, NO_MODIFIERS } from '../data/keys';

const moveSelectedPointsMapping: KeyMapping[] = [
  {
    key: 'ArrowDown',
    modifiers: { control: false, shift: true, alt: false },
    message: 'MOVE_SELECTED_POINTS_DOWN',
  },
  {
    key: 'ArrowUp',
    modifiers: { control: false, shift: true, alt: false },
    message: 'MOVE_SELECTED_POINTS_UP',
  },
  {
    key: 'ArrowLeft',
    modifiers: { control: false, shift: true, alt: false },
    message: 'MOVE_SELECTED_POINTS_LEFT',
  },
  {
    key: 'ArrowRight',
    modifiers: { control: false, shift: true, alt: false },
    message: 'MOVE_SELECTED_POINTS_RIGHT',
  },
];

const moveSelectionMappings: KeyMapping[] = [
  {
    key: 'ArrowDown',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_SELECTION_POS_DOWN',
  },
  {
    key: 'ArrowUp',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_SELECTION_POS_UP',
  },
  {
    key: 'ArrowLeft',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_SELECTION_POS_LEFT',
  },
  {
    key: 'ArrowRight',
    modifiers: NO_MODIFIERS,
    message: 'MOVE_SELECTION_POS_RIGHT',
  },
];

const toggleSpotStatus: KeyMapping[] = [
  {
    key: 'KeyF',
    modifiers: NO_MODIFIERS,
    message: 'TOGGLE_POS_FAIL',
  },
  {
    key: 'KeyN',
    modifiers: NO_MODIFIERS,
    message: 'TOGGLE_NO_SIGNAL',
  },
];

const toggleSelectionMode: KeyMapping[] = [
  {
    key: 'KeyR',
    modifiers: NO_MODIFIERS,
    message: 'TOGGLE_ROW_SELECTION_MODE',
  },
  {
    key: 'KeyG',
    modifiers: NO_MODIFIERS,
    message: 'TOGGLE_ALL_SELECTION_MODE',
  },
];

const blockStateMappings: KeyMapping[] = [
  {
    key: 'KeyA',
    modifiers: { control: true, alt: false, shift: false },
    message: 'MARK_BLOCK_AS_OK',
  },
  {
    key: 'KeyD',
    modifiers: { control: true, alt: false, shift: false },
    message: 'MARK_BLOCK_AS_DISCARDED',
  },
];

const navigationMappings: KeyMapping[] = [
  {
    key: 'KeyN',
    modifiers: { control: true, alt: true, shift: false },
    message: 'GO_TO_NEXT_BLOCK',
  },
  {
    key: 'KeyP',
    modifiers: { control: true, alt: true, shift: false },
    message: 'GO_TO_PREVIOUS_BLOCK',
  },
  {
    key: 'KeyR',
    modifiers: { control: true, alt: true, shift: false },
    message: 'OPEN_SLIDE_VIEW',
  },
];

const serviceMappings: KeyMapping[] = [
  {
    key: 'KeyD',
    modifiers: { control: true, alt: true, shift: false },
    message: 'PERFORM_DROP_GRID',
  },
  {
    key: 'KeyM',
    modifiers: { control: true, alt: true, shift: false },
    message: 'PERFORM_GRID_MEASURE',
  },
  {
    key: 'KeyG',
    modifiers: { control: true, alt: true, shift: false },
    message: 'PERFORM_GRID_ALIGN',
  },
];

export const blockKeyMappings: KeyMapping[] = [
  ...toggleSpotStatus,
  ...toggleSelectionMode,
  ...moveSelectedPointsMapping,
  ...moveSelectionMappings,
  ...blockStateMappings,
  ...navigationMappings,
  ...serviceMappings,
];
