import { EffectMessage } from './effects';

export const NO_MODIFIERS = { control: false, shift: false, alt: false };

export type KeyModifiers = { shift: boolean; alt: boolean; control: boolean };

export type KeyMapping = {
  key: string;
  modifiers: KeyModifiers;
  message: EffectMessage;
};
