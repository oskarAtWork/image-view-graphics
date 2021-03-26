import { ensureList, ensureNumber, ensureString } from './ensure-utils';
import { Block, isBlockState, isSpotStatus, Spot } from '../data/models';

export const ensureSpot = (x: unknown): Spot => {
  const p = x as Spot;

  const status = ensureString(p.status);

  if (!isSpotStatus(status)) {
    throw Error(`Unknown status for spot ${status}`);
  }

  return {
    background: ensureNumber(p.background),
    pcid: ensureString(p.pcid),
    pos_str: ensureString(p.pos_str),
    q_sat: ensureNumber(p.q_sat),
    q_size: ensureNumber(p.q_size),
    q_sn: ensureNumber(p.q_sn),
    signal: ensureNumber(p.signal),
    status,
    trimmed_signal: ensureNumber(p.trimmed_signal),
    x: ensureNumber(p.x),
    y: ensureNumber(p.y),
  };
};

export const ensureBlock = (x: unknown): Block => {
  try {
    const b = x as Block;

    const state = ensureString(b.state);

    if (!isBlockState(state)) {
      throw Error(`Unknown status for spot ${state}`);
    }

    return {
      data: ensureList(b.data, (row) => ensureList(row, ensureSpot)),
      state,
      sample_name: ensureString(b.sample_name),
      spot_r: ensureNumber(b.spot_r),
    };
  } catch (error) {
    console.error('Could not parse:', x);
    throw error;
  }
};
