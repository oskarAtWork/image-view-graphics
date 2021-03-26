import * as PIXI from 'pixi.js';
import { BlockHandler } from '../state/block-handler';
import { isDefined } from '../helpers/list-helpers';
import { Camera, CameraState } from '../camera';
import { ensureBlock } from '../type-validation/ensure-json';
import { KeyHandler } from '../key-mappings/key-handler';
import { BlockResource, SlideHandler } from '../state/slide-handler';
import { BlockView } from './block-view';
import { SlideView } from './slide-view';
import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { API } from '../state/api';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Unsubcribe } from '../data/rxjs-types';
import { InfoMessage } from '../data/api-models';
import { Block } from '../data/models';

export class App {
  private slideView: SlideView | null = null;
  private blockView: BlockView | null = null;

  private createLayer = (): PIXI.Container => {
    const container = new PIXI.Container();
    container.interactive = true;
    return container;
  };

  private blockUiLayer = this.createLayer();
  private blockLayer = this.createLayer();
  private slideUiLayer = this.createLayer();
  private slideLayer = this.createLayer();

  private mouseHitArea = new PIXI.Rectangle(0, 0, 1, 1);

  constructor(
    private app: PIXI.Application,
    private camera: Camera,
    private api: API,
    private slideHandler: SlideHandler,
    private blockHandler: BlockHandler,
    private keyHandler: KeyHandler,
    private infoMessage$: Subject<InfoMessage>,
    private unsubscribe: Unsubcribe
  ) {
    app.stage.interactive = true;
    app.stage.hitArea = this.mouseHitArea;
    camera.connectToView(app.stage);

    this.slideUiLayer.zIndex = -1;
    this.setUpSubscriptionListeners();
    this.setCrossFade(1);
    this.app.ticker.add(this.tick.bind(this));
  }

  public processKey(down: boolean, keyCode: string): void {
    if (down) {
      this.keyHandler.keyPress(keyCode);
    } else {
      this.keyHandler.keyRelease(keyCode);
    }
  }

  private loadBlock(json: string, img: string, blockName: string, i: number): BlockResource | null {
    const resources = PIXI.Loader.shared.resources;
    let block: Block | null = null;

    try {
      block = ensureBlock(resources[json].data);
    } catch (error) {
      console.error(error);
      this.infoMessage$.next({
        title: 'Error',
        message: `Could not load block ${blockName}`,
        severity: 'error',
      });
    }

    if (!block) {
      return null;
    }

    const texture = resources[img].texture;
    const image = new PIXI.Sprite(texture);

    image.interactive = true;
    const x = i % 2;
    const y = Math.floor(i / 2);

    image.x = x * image.width;
    image.y = y * image.height;

    return {
      x,
      y,
      name: blockName,
      image,
      initial: block,
      current: { ...block },
      texture,
      modified: false,
    };
  }

  public reload(blockNames: string[], imageTemplate: string, dataTemplate: string): void {
    const loader = PIXI.Loader.shared;

    loader.onError.add((err) => {
      console.error('Error when loading asset for pixi: ', err);
      this.infoMessage$.next({
        title: 'Error',
        message: 'Could not load file',
        severity: 'error',
      });
    });

    const images = blockNames.map((block) => imageTemplate.replace('BB', block));
    const jsons = blockNames.map((block) => dataTemplate.replace('BB', block));

    images.forEach((file) => loader.add(file));
    jsons.forEach((file) => loader.add(file));

    loader.load(() => {
      const blocksResources: BlockResource[] = [...blockNames]
        .sort()
        .map((blockName, i) => this.loadBlock(jsons[i], images[i], blockName, i))
        .filter(isDefined);

      blocksResources.forEach(({ image }, i) => {
        image.on('mouseover', () => {
          this.slideHandler.setHighlighted(i);
        });
      });

      this.slideView = new SlideView(
        this.slideHandler,
        this.slideLayer,
        this.slideUiLayer,
        this.unsubscribe,
        blocksResources,
        this.camera
      );

      this.swapView(null);

      const cameraState = Camera.calculateFramedView(
        0,
        0,
        this.slideView.contentSize[0],
        this.slideView.contentSize[1],
        this.app.screen.width,
        this.app.screen.height
      );

      this.camera.panAndZoom$.next(cameraState);

      this.slideHandler.setBlocks(blocksResources);
      this.api.progress$.next({
        message: 'Done',
        progress: 100,
        request: 'HIDE_PROGRESS',
      });
    });
  }

  public destroy(): void {
    PIXI.Loader.shared.reset();
    for (const textureUrl in PIXI.utils.BaseTextureCache) {
      delete PIXI.utils.BaseTextureCache[textureUrl];
    }
    for (const textureUrl in PIXI.utils.TextureCache) {
      delete PIXI.utils.TextureCache[textureUrl];
    }

    [this.slideUiLayer, this.slideLayer, this.blockLayer, this.blockUiLayer].forEach((layer) => {
      layer.removeAllListeners();
      layer.removeChildren();
      layer.destroy();
    });

    this.slideHandler.reset();
  }

  private setCrossFade(slideAlpha: number) {
    this.blockLayer.alpha = 1 - slideAlpha;
    this.blockUiLayer.alpha = 1 - slideAlpha;

    this.slideLayer.alpha = slideAlpha;
    this.slideUiLayer.alpha = slideAlpha;

    this.setIsInApp(this.blockLayer, 1 - slideAlpha > 0);
    this.setIsInApp(this.blockUiLayer, 1 - slideAlpha > 0);
    this.setIsInApp(this.slideLayer, slideAlpha > 0);
    this.setIsInApp(this.slideUiLayer, slideAlpha > 0);
  }

  private transition(block: BlockResource | null): void {
    if (!this.slideView) {
      return;
    }

    const slideTarget = Camera.calculateFramedView(
      0,
      0,
      this.slideView.contentSize[0],
      this.slideView.contentSize[1],
      this.app.screen.width,
      this.app.screen.height
    );

    const animateToSlide = (target: CameraState, toSlide: boolean): ((t: number) => void) => {
      const from = this.camera.panAndZoom$.value;
      return (t: number) => {
        this.camera.panAndZoom$.next(Camera.interpolate(from, t, target));
        this.setCrossFade(toSlide ? t : 1 - t);
      };
    };

    if (block) {
      const blockTarget = Camera.calculateFramedView(
        block.image.x,
        block.image.y,
        block.image.width,
        block.image.height,
        this.app.screen.width,
        this.app.screen.height
      );

      if (!this.blockView) {
        this.swapView(block);

        this.camera.startAnimation(30, animateToSlide(blockTarget, false), () => {
          return;
        });
      } else if (block.current !== this.blockView.block) {
        const middle = Camera.interpolate(this.camera.panAndZoom$.value, 0.5, slideTarget);

        this.camera.startAnimation(20, animateToSlide(middle, true), () => {
          this.swapView(block);
          this.camera.startAnimation(20, animateToSlide(blockTarget, false), () => {
            return;
          });
        });
      }
    } else {
      this.camera.startAnimation(30, animateToSlide(slideTarget, true), () => this.swapView(block));
    }
  }

  private tick() {
    this.camera.setWindowSize(this.app.screen.width, this.app.screen.height);
    this.camera.animationTick();
    if (this.blockView) this.blockView.tick();
  }

  private swapView(blockResource: BlockResource | null) {
    if (blockResource) {
      this.blockLayer.removeChildren();
      this.blockUiLayer.removeChildren();

      this.blockView = new BlockView(
        this.blockLayer,
        this.blockUiLayer,
        this.blockHandler,
        blockResource,
        this.camera,
        this.api
      );

      this.camera.setFocus(
        this.blockLayer,
        blockResource.image.x,
        blockResource.image.y,
        blockResource.image.width,
        blockResource.image.height
      );
    } else if (this.slideView) {
      this.blockView = null;
      this.camera.setFocus(this.slideLayer, 0, 0, this.slideView.contentSize[0], this.slideView.contentSize[1]);
    }
  }

  private setIsInApp(child: PIXI.DisplayObject, inApp: boolean) {
    if (inApp) {
      if (!this.app.stage.children.includes(child)) {
        this.app.stage.addChild(child);
      }
    } else {
      this.app.stage.removeChild(child);
    }
  }

  private subscribeTo<T>(obs: Observable<T>, fn: (t: T) => void) {
    obs.pipe(takeUntil(this.unsubscribe)).subscribe(fn);
  }

  private setUpSubscriptionListeners() {
    this.subscribeTo(this.camera.panAndZoom$, ({ pan, zoom }) => {
      [this.blockLayer, this.slideLayer].forEach((layer) => {
        layer.setTransform(pan[0], pan[1], zoom, zoom);
      });

      if (this.blockView) {
        this.blockView.updateSpots();
      }

      if (this.slideView) {
        if (this.camera.isAnimating()) {
          this.slideView.updateUi();
        } else if (!this.blockView) {
          this.slideView.updateUi();
        }
      }
    });

    this.subscribeTo(this.camera.windowSize$, ([w, h]) => {
      this.mouseHitArea.width = w;
      this.mouseHitArea.height = h;
    });

    this.subscribeTo(this.api.colorFilter$, ({ gamma, brightness, contrast, colorMask }) => {
      const filter = new AdjustmentFilter({
        gamma,
        brightness,
        contrast,
        red: colorMask === 'none' || colorMask === 'red' ? 1 : 0,
        green: colorMask === 'none' || colorMask === 'green' ? 1 : 0,
        blue: colorMask === 'none' || colorMask === 'blue' ? 1 : 0,
      });

      this.slideLayer.filters = [filter];
      this.blockLayer.filters = [filter];
    });

    this.subscribeTo(this.slideHandler.selected$, (selected) => {
      this.transition(this.slideHandler.getBlockResource(selected));
    });
  }
}
