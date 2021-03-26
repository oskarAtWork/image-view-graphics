import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { API } from '..';
import { Spot, SpotStatus } from '../data/models';
import { ON_LOAD_GRID_STATE_FAILED_BUTTON_INFO, SUCCESS_BUTTON_INFO } from '../data/non-exported-constants';
import { BlockResource } from './slide-handler';

export type SelectionMode = 'single' | 'row' | 'all';

type Selection = {
  mode: SelectionMode;
  position: [number, number] | null;
};

const INDEX_CONVERTER = 1000;

export const toIndex = (r: number, c: number): number => r * INDEX_CONVERTER + c;

export const fromIndex = (index: number): [number, number] => {
  const c = index % INDEX_CONVERTER;
  const r = (index - c) / INDEX_CONVERTER;
  return [r, c];
};

export class BlockHandler {
  private selection$: BehaviorSubject<Selection>;
  public selectedSpots$ = new BehaviorSubject<number[]>([]);
  public spots$ = new BehaviorSubject<Spot[][]>([]);
  private reload$ = new Subject();
  public current$ = new BehaviorSubject<BlockResource | null>(null);
  public modified$ = new BehaviorSubject<boolean>(false);

  constructor(private api: API) {
    this.selection$ = new BehaviorSubject<Selection>({
      mode: 'single',
      position: null,
    });

    this.subscribeTo(this.selection$, (selection) => {
      this.selectedSpots$.next(this.getSelectedSpots(selection));
    });

    this.subscribeTo(this.current$, (blockRes) => {
      if (blockRes) {
        this.spots$.next(blockRes.current.data);
        this.selection$.next({
          mode: 'single',
          position: null,
        });
        this.modified$.next(blockRes.modified);
        api.buttonsEnabled$.next(
          blockRes.current.state === 'GRIDDED_FAILED' ? ON_LOAD_GRID_STATE_FAILED_BUTTON_INFO : SUCCESS_BUTTON_INFO
        );
      }
    });
  }

  public subscribeTo<T>(obs: Observable<T>, fn: (t: T) => void): void {
    obs.pipe(takeUntil(this.api.unsub)).subscribe(fn);
  }

  private getSelectedSpots = ({ mode, position }: Selection): number[] => {
    if (!position) {
      return [];
    }

    const [selectedRow, selectedColumn] = position;

    if (mode === 'single') {
      return [toIndex(selectedRow, selectedColumn)];
    } else if (mode === 'row') {
      return this.spots$.value[selectedRow].map((_, c) => toIndex(selectedRow, c));
    } else {
      const selection = [];
      const spots = this.spots$.value;

      for (let r = 0; r < spots.length; r++) {
        for (let c = 0; c < spots[r].length; c++) {
          selection.push(toIndex(r, c));
        }
      }

      return selection;
    }
  };

  public setSpots(spots: Spot[][]): void {
    this.spots$.next(spots);
  }

  public onUpdate(fn: () => void): void {
    this.reload$.pipe(takeUntil(this.api.unsub)).subscribe(fn);
  }

  public update(): void {
    this.reload$.next({});
  }

  public toggleSelectionMode(newMode: SelectionMode): void {
    const current = this.selection$.value;

    this.selection$.next({
      ...this.selection$.value,
      mode: current.mode === newMode ? 'single' : newMode,
    });
  }

  public setSelectionPosition(position: [number, number] | null): void {
    this.selection$.next({
      ...this.selection$.value,
      position,
    });
  }

  public toggleSpotStatus(toggleStatus: SpotStatus): void {
    const selected = this.selectedSpots$.value;
    const spots = this.spots$.value;
    const alreadyToggled = selected.map(fromIndex).filter(([r, c]) => spots[r][c].status === toggleStatus);
    const status: SpotStatus = alreadyToggled.length === selected.length ? 'OK' : toggleStatus;

    const updatedSpots = this.spotMap((spot, r, c) => {
      if (selected.includes(toIndex(r, c))) {
        return { ...spot, status };
      } else {
        return spot;
      }
    });

    this.modified$.next(true);
    this.spots$.next(updatedSpots);
  }

  public moveSelectionPointer(delta: [number, number]): void {
    const selection = this.selection$.value;
    const spots = this.spots$.value;

    if (!selection.position) {
      return;
    }

    const [r, c] = selection.position;
    const [dc, dr] = delta;

    const newR = (r + dr + spots.length) % spots.length;
    const newC = (c + dc + spots[newR].length) % spots[newR].length;

    this.selection$.next({ ...selection, position: [newR, newC] });
  }

  private spotMap(fn: (spot: Spot, r: number, c: number) => Spot): Spot[][] {
    return this.spots$.value.map((row, r) =>
      row.map((spot, c) => {
        return fn(spot, r, c);
      })
    );
  }

  public moveSpots(dx: number, dy: number): void {
    const selected = this.selectedSpots$.value;

    const updatedSpots = this.spotMap((spot, r, c) => {
      const { x, y, status, ...rest } = spot;
      const newStatus = status === 'NO_SIGNAL' ? 'NO_SIGNAL' : 'POS_MANUAL';
      const isSelected = selected.includes(toIndex(r, c));
      return isSelected ? { ...rest, x: x + dx, y: y + dy, status: newStatus } : spot;
    });

    this.spots$.next(updatedSpots);
    this.modified$.next(true);
  }
}
