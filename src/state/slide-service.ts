import { Block } from '../data/models';
import { ensureBlock } from '../type-validation/ensure-json';
import { BlockResource } from './slide-handler';

import axios from 'axios';
import { Subject } from 'rxjs';
import { InfoMessage } from '../data/api-models';

type BlockPacket = {
  blockName: string;
  slideName: string;
  grid: Block;
};

export class SlidesService {
  constructor(private infoMessage$: Subject<InfoMessage>, private baseUrl: string) {}

  public async saveBlocks(slideName: string, blockArray: [string, Block][]): Promise<boolean> {
    const URL = `${this.baseUrl}/images/save`;
    const message$ = this.infoMessage$;
    const formattedBlockNames = blockArray.map(([name]) => name).join(', ');

    if (blockArray.length === 0) {
      message$.next({
        title: 'No save needed',
        message: 'No blocks were modified',
        severity: 'info',
      });
      return false;
    }

    message$.next({
      title: 'Saving',
      message: `Saving [${formattedBlockNames}]`,
      severity: 'info',
    });

    async function sendBlock(blockName: string, block: Block) {
      const packet = {
        blockName,
        slideName,
        grid: block,
      };

      try {
        await axios.post(URL, packet);
        console.log('Block ' + block + ' saved ' + packet.grid.state);
        return null;
      } catch (error) {
        console.error(`Error occured when saving ${error}`);
        return blockName;
      }
    }

    const promises = blockArray.map(([name, block]) => sendBlock(name, block));
    const failedBlocks = (await Promise.all(promises)).filter((value): value is string => value !== null);

    if (failedBlocks.length) {
      message$.next({
        title: 'Error while saving files',
        message: `Could not save these blocks: [${failedBlocks.join(', ')}]`,
        severity: 'warning',
      });
      return false;
    } else {
      message$.next({
        title: 'Saved',
        message: `Blocks [${formattedBlockNames}] saved`,
        severity: 'success',
      });
    }

    return true;
  }

  private async augmentBlock(scriptName: string, packet: BlockPacket) {
    const URL = `${this.baseUrl}/images/${scriptName}`;

    try {
      const response = await axios.post(URL, packet);
      return ensureBlock(response.data);
    } catch (error) {
      this.infoMessage$.next({
        title: 'Error',
        message: `Failed to run '${scriptName.replace('-', '')}'`,
        severity: 'error',
      });
      return null;
    }
  }

  public async dropGrid(slideName: string, blockRes: BlockResource): Promise<Block | null> {
    return this.augmentBlock('drop-grid', {
      blockName: blockRes.name,
      slideName,
      grid: blockRes.current,
    });
  }

  public async alignGrid(slideName: string, blockRes: BlockResource): Promise<Block | null> {
    return this.augmentBlock('grid-align', {
      blockName: blockRes.name,
      slideName,
      grid: blockRes.current,
    });
  }

  public async measureGrid(slideName: string, blockRes: BlockResource): Promise<Block | null> {
    return this.augmentBlock('grid-measure', {
      blockName: blockRes.name,
      slideName,
      grid: blockRes.current,
    });
  }
}
