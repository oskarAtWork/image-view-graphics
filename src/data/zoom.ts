export type Zoom = {
  value: number;
  behaviour: 'to_mouse' | 'to_center' | 'reset' | 'none';
  change: 'absolute' | 'multiply';
};
