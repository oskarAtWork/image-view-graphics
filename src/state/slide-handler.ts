import { BehaviorSubject, Observable } from 'rxjs';
import { Block, BlockState } from '../data/models';
import * as PIXI from 'pixi.js';
import { filter, map, takeUntil } from 'rxjs/operators';
import { BlockHandler } from './block-handler';
import { API } from './api';
import { ON_LOAD_GRID_STATE_AFTER_PYTHON, SUCCESS_BUTTON_INFO } from '../data/non-exported-constants';

export type BlockResource = {
  name: string;
  initial: Block;
  current: Block;
  texture: PIXI.Texture;
  image: PIXI.Sprite;
  modified: boolean;
  x: number;
  y: number;
};

export class SlideHandler {
  public selected$ = new BehaviorSubject(-1);
  public highlighted$ = new BehaviorSubject(-1);
  public blockResources$ = new BehaviorSubject<BlockResource[]>([]);
  public selectedBlockResource$: Observable<BlockResource>;

  constructor(private api: API) {
    this.selectedBlockResource$ = this.selected$.pipe(
      filter((selected) => selected >= 0 && selected <= this.blockResources$.value.length),
      map((selected) => this.blockResources$.value[selected]),
      takeUntil(api.unsub)
    );
  }

  public reset(): void {
    this.selected$.next(-1);
    this.highlighted$.next(-1);
    this.blockResources$.next([]);
  }

  public setBlocks(blockResources: BlockResource[]): void {
    this.blockResources$.next(blockResources);
  }

  public getSelectedBlockResource(): BlockResource | null {
    return this.getBlockResource(this.selected$.value);
  }

  public getHighlightedBlock(): BlockResource | null {
    return this.getBlockResource(this.highlighted$.value);
  }

  public updateBlockRes(name: string, blockRes: Partial<BlockResource>): void {
    const value = this.blockResources$.value.map((res) => {
      if (res.name === name) {
        const newRes = {
          ...res,
          ...blockRes,
        };
        return newRes;
      }
      return res;
    });

    this.blockResources$.next(value);
  }

  public updateBlock(name: string, block: Block): void {
    this.updateBlockRes(name, { current: block, modified: true });
    this.api.buttonsEnabled$.next(
      block.state === 'GRIDDED_FAILED' ? ON_LOAD_GRID_STATE_AFTER_PYTHON : SUCCESS_BUTTON_INFO
    );
  }

  public setModified(): void {
    const blockRes = this.getSelectedBlockResource();

    if (blockRes) {
      this.updateBlockRes(blockRes.name, { modified: true });
    }
  }

  public resetBlock(): void {
    const blockRes = this.getSelectedBlockResource();

    if (blockRes) {
      this.updateBlock(blockRes.name, { ...blockRes.initial });
    } else {
      this.api.infoMessage$.next({
        title: 'Cannot reset',
        message: 'No selected block to reset',
        severity: 'info',
      });
    }
  }

  public updateInitial(names: string[]): void {
    const nameSet = new Set(names);

    const newValues = this.blockResources$.value.map((res) =>
      nameSet.has(res.name) ? { ...res, initial: { ...res.current } } : res
    );

    this.blockResources$.next(newValues);
  }

  public rollback(): void {
    const value = this.blockResources$.value.map((block) => ({
      ...block,
      current: { ...block.initial },
    }));

    this.blockResources$.next(value);
    this.api.infoMessage$.next({
      title: 'Rollback',
      message: 'Slide reset to last save',
      severity: 'success',
    });
  }

  public setHighlighted(index: number): void {
    this.highlighted$.next(index);
  }

  public setSelectedToHighlighted(): void {
    this.selected$.next(this.highlighted$.value);
  }

  public gotoSlideView(blockHandler: BlockHandler, withState?: BlockState): void {
    const spots = blockHandler.spots$.value;
    const blockRes = blockHandler.current$.value;

    if (blockRes) {
      this.updateBlockRes(blockRes.name, {
        ...blockRes,
        current: {
          ...blockRes.current,
          data: spots,
          state: withState || blockRes.current.state,
        },
        modified: true,
      });
    }

    this.selected$.next(-1);
  }

  public changeSelected(delta: number): void {
    this.selected$.next(Math.max(0, Math.min(this.selected$.value + delta, this.blockResources$.value.length - 1)));
  }

  public getBlockResource(index: number): BlockResource | null {
    return this.blockResources$.value[index] || null;
  }

  public moveHighlighted(dx: number, dy: number): void {
    const allRes = this.blockResources$.value;

    if (!allRes.length) {
      this.highlighted$.next(-1);
      return;
    }

    const highlighted = this.highlighted$.value;
    const blockRes = this.getBlockResource(highlighted);

    if (!blockRes) {
      this.highlighted$.next(0);
      return;
    }

    const { x, y } = blockRes;

    const width = 1 + Math.max(...allRes.map((res) => res.x));
    const newX = (x + dx) % width;

    const height = 1 + Math.max(...allRes.filter((res) => res.x === newX).map((res) => res.y));
    const newY = (y + dy) % height;

    const index = this.blockResources$.value.findIndex((res) => res.x === newX && res.y === newY);

    if (index >= 0) {
      this.highlighted$.next(index);
    }
  }

  public getBlocksForSave(): [string, Block][] {
    return this.blockResources$.value.filter((res) => res.modified).map((res) => [res.name, res.current]);
  }
}
