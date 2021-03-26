import { blockKeyMappings } from './block_mappings';
import { generalKeyMappings } from './general_mappings';
import { griddingMappings } from './gridding_mapping';
import { KeyMapping } from '../data/keys';
import { API } from '../state/api';
import { Unsubcribe } from '../data/rxjs-types';
import { map, takeUntil } from 'rxjs/operators';

export class KeyHandler {
  pressedKeys = new Set<string>();
  inBlockMode = false;

  public constructor(private api: API, unsub: Unsubcribe) {
    api.inBlockMode$
      .pipe(
        map((inBlockMode) => {
          this.inBlockMode = inBlockMode;
        }),
        takeUntil(unsub)
      )
      .subscribe();
  }

  private ctrl(): boolean {
    return (
      this.pressedKeys.has('MetaLeft') ||
      this.pressedKeys.has('MetaRight') ||
      this.pressedKeys.has('ControlLeft') ||
      this.pressedKeys.has('ControlRight')
    );
  }

  private shift(): boolean {
    return this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');
  }

  private alt(): boolean {
    return this.pressedKeys.has('AltLeft') || this.pressedKeys.has('AltRight');
  }

  private match(key: string) {
    const performAllMatching = (mapping: KeyMapping[]) =>
      mapping
        .filter(
          (keyMapEntry) =>
            keyMapEntry.key === key &&
            keyMapEntry.modifiers.alt === this.alt() &&
            keyMapEntry.modifiers.control === this.ctrl() &&
            keyMapEntry.modifiers.shift === this.shift()
        )
        .forEach((keyMapEntry) => this.api.perform(keyMapEntry.message));

    performAllMatching(generalKeyMappings);

    if (this.inBlockMode) {
      performAllMatching(blockKeyMappings);
    } else {
      performAllMatching(griddingMappings);
    }
  }

  public keyPress(keyCode: string): void {
    console.log({ keyCode });
    this.pressedKeys.add(keyCode);
    this.match(keyCode);
  }

  public keyRelease(keyCode: string): void {
    this.pressedKeys.delete(keyCode);
  }
}
