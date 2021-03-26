import { BlockState, SpotStatus } from './models';

export type ColorMask = 'red' | 'blue' | 'green' | 'none';

export type ColorFilter = {
  gamma: number;
  brightness: number;
  contrast: number;
  colorMask: ColorMask;
};

export const colorFromBlockState = (state: BlockState): number => {
  if (state === 'OK') {
    return 0x00ff00;
  } else if (state === 'SPOT_POS_AUTO_ADJUSTED') {
    return 0xffffff;
  } else if (state === 'GRIDDED_FAILED') {
    return 0x0000ff;
  } else if (state === 'WORKING') {
    return 0xffff00;
  } else if (state === 'DISCARD') {
    return 0xff0000;
  }

  throw Error(`Unknown block state '${state}'`);
};

export const colorFromSpotState = (status: SpotStatus): number => {
  if (status === 'OK') {
    return 0x00ff00;
  } else if (status === 'NO_SIGNAL') {
    return 0x0000ff;
  } else if (status === 'BORDER') {
    return 0xffff00;
  } else if (status === 'LT_LOD') {
    return 0x000000;
  } else if (status === 'POS_FAIL') {
    return 0xff0000;
  } else if (status === 'POS_MANUAL') {
    return 0x00ffff;
  }

  throw Error(`Unknown spot state '${status}'`);
};
