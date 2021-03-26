import { BehaviorSubject, Observable, race, ReplaySubject, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Zoom } from '../data/zoom';
import { EffectMessage } from '../data/effects';
import { Unsubcribe } from '../data/rxjs-types';
import { ColorFilter } from '../data/color';
import { LoadingProgress } from '../data/loading';
import { initialColorFilter } from '../data/constants';
import { BlockResource } from './slide-handler';
import { ButtonInfo, InfoMessage } from '../data/api-models';

export class API {
  public mutableEffect$ = new BehaviorSubject<{ message: EffectMessage }>({ message: '' });
  public zoom$ = new BehaviorSubject<number>(1);
  public inBlockMode$ = new BehaviorSubject<boolean>(false);
  public zoomEffects$ = new BehaviorSubject<Zoom | null>(null);
  public progress$ = new BehaviorSubject<LoadingProgress | null>(null);
  public colorFilter$ = new BehaviorSubject<ColorFilter>(initialColorFilter);
  public focusedBlock$ = new Subject<BlockResource | null>();
  public infoMessage$ = new ReplaySubject<InfoMessage>(5);
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public buttonsEnabled$ = new BehaviorSubject<ButtonInfo>({
    okButton: false,
    discardButton: false,
    measureButton: false,
    alignButton: false,
    dropButton: false,
  });

  constructor(public unsub: Unsubcribe) {}

  public isLoading(): boolean {
    return this.isLoading$.value;
  }

  public perform(message: EffectMessage): void {
    this.mutableEffect$.next({ message });
  }

  public performZoom(zoom: Zoom): void {
    this.zoomEffects$.next(zoom);
  }

  public adjustColorFilter(colorFilter: Partial<ColorFilter>): void {
    const old = this.colorFilter$.value;
    this.colorFilter$.next({ ...old, ...colorFilter });
  }

  public on(target: EffectMessage, unsub?: Unsubcribe): Observable<EffectMessage> {
    const until = unsub ? race(unsub, this.unsub) : this.unsub;

    return this.mutableEffect$.pipe(
      filter(({ message }) => message === target),
      map(({ message }) => message),
      takeUntil(until)
    );
  }
}
