export type BlockState = 'OK' | 'GRIDDED_FAILED' | 'SPOT_POS_AUTO_ADJUSTED' | 'WORKING' | 'DISCARD';

const blockStates = new Set<BlockState>(['OK', 'GRIDDED_FAILED', 'SPOT_POS_AUTO_ADJUSTED', 'WORKING', 'DISCARD']);

export const isBlockState = (x: string): x is BlockState => blockStates.has(x as BlockState);

export type SpotStatus = 'OK' | 'NO_SIGNAL' | 'BORDER' | 'LT_LOD' | 'POS_FAIL' | 'POS_MANUAL';

const spotStatuses = new Set<SpotStatus>(['OK', 'NO_SIGNAL', 'BORDER', 'LT_LOD', 'POS_FAIL', 'POS_MANUAL']);

export const isSpotStatus = (x: string): x is SpotStatus => spotStatuses.has(x as SpotStatus);

export type Spot = {
  background: number;
  pcid: string;
  pos_str: string;
  q_sat: number;
  q_size: number;
  q_sn: number;
  signal: number;
  status: SpotStatus;
  trimmed_signal: number;
  x: number;
  y: number;
};

export type Block = {
  data: Spot[][];
  sample_name: string;
  spot_r: number;
  state: BlockState;
};

export type ImageDetails = {
  image: string;
  data: string;
  blocks: string[];
  slide: string;
};
