import { App } from './views/application';
import * as PIXI from 'pixi.js';
import { BlockHandler } from './state/block-handler';
import { API } from './state/api';
import { SlidesService } from './state/slide-service';
import { handleEffects } from './state/effect-handler';
import { Camera } from './camera';
import { SlideHandler } from './state/slide-handler';
import { KeyHandler } from './key-mappings/key-handler';
import { Unsubcribe } from './data/rxjs-types';

export type ViewConfig = {
  view: HTMLCanvasElement;
  resizeTo: Window;
  devicePixelRatio: number;
};

type Effects = {
  camera: Camera;
  slideHandler: SlideHandler;
  blockHandler: BlockHandler;
  slideService: SlidesService;
  api: API;
};

let effects: Effects | null = null;

export const getApi = (): API => {
  if (!effects) {
    throw Error('No api, run initEffects first');
  }
  return effects.api;
};

export const initApi = (slide: string, apiUrl: string, unsubscribe: Unsubcribe): API => {
  console.log('running version 13');

  const api = new API(unsubscribe);

  const slideHandler = new SlideHandler(api);
  const blockHandler = new BlockHandler(api);
  const slideService = new SlidesService(api.infoMessage$, apiUrl);

  const camera = new Camera();

  handleEffects(blockHandler, slideService, slideHandler, api, camera, slide, unsubscribe);

  effects = {
    camera,
    slideHandler,
    blockHandler,
    slideService,
    api,
  };

  return api;
};

export const initApplication = (config: ViewConfig): App => {
  if (!effects) {
    throw Error('Effects are not created, initEffects must be called first');
  }

  const pixiApp = new PIXI.Application({
    view: config.view,
    resizeTo: config.resizeTo,
    resolution: config.devicePixelRatio,
    backgroundColor: 0x444444,
  });

  return new App(
    pixiApp,
    effects.camera,
    effects.api,
    effects.slideHandler,
    effects.blockHandler,
    new KeyHandler(effects.api, effects.api.unsub),
    effects.api.infoMessage$,
    effects.api.unsub
  );
};
