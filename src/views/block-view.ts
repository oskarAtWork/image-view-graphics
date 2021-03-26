import { Block, Spot } from '../data/models';
import * as PIXI from 'pixi.js';
import { colorFromSpotState } from '../data/color';
import { Camera } from '../camera';
import { BlockHandler, toIndex } from '../state/block-handler';
import { forEach2d } from '../helpers/list-helpers';
import { API } from '../state/api';
import { BlockResource } from '../state/slide-handler';

const CIRCLE_RADIUS = 8;

type SpotInfo = {
  graphic: PIXI.Graphics;
  selected: boolean;
  spot: Spot;
  remove: boolean;
  radius: number;
};

export class BlockView {
  public spotInfos = new Map<number, SpotInfo>();
  public image: PIXI.Sprite;
  public block: Block;

  public constructor(
    private blockLayer: PIXI.Container,
    private uiLayer: PIXI.Container,
    private blockHandler: BlockHandler,
    public blockResource: BlockResource,
    private camera: Camera,
    private api: API
  ) {
    this.block = blockResource.current;
    blockHandler.current$.next(blockResource);

    this.image = new PIXI.Sprite(blockResource.texture);
    this.image.x = blockResource.image.x;
    this.image.y = blockResource.image.y;

    blockLayer.addChild(this.image);

    forEach2d(this.block.data, (spot, r, c) => {
      this.newSpotGraphic(r, c, spot, false);
    });

    blockHandler.subscribeTo(blockHandler.spots$, () => {
      this.updateStuff();
    });

    blockHandler.onUpdate(() => {
      this.spotInfos.forEach((spotInfo) => {
        spotInfo.graphic.alpha = 0;
        spotInfo.radius = CIRCLE_RADIUS * 2;
      });
    });

    blockHandler.subscribeTo(blockHandler.selectedSpots$, () => {
      this.updateStuff();
    });

    blockHandler.subscribeTo(this.api.isLoading$, (isLoading) => {
      uiLayer.alpha = isLoading ? 0 : 1;
    });
  }

  public tick(): void {
    this.spotInfos.forEach((spotInfo) => {
      if (spotInfo.graphic.alpha !== 1) {
        const alpha = 0.1 + 0.9 * spotInfo.graphic.alpha;
        spotInfo.graphic.alpha = alpha > 0.99 ? 1 : alpha;
      }

      if (spotInfo.radius !== CIRCLE_RADIUS) {
        const radius = 0.1 * CIRCLE_RADIUS + 0.9 * spotInfo.radius;
        spotInfo.radius = Math.abs(radius - CIRCLE_RADIUS) < 0.01 ? CIRCLE_RADIUS : radius;
        this.drawSpot(spotInfo);
      }
    });
  }

  private newSpotGraphic(r: number, c: number, spot: Spot, selected: boolean): SpotInfo {
    const graphic = new PIXI.Graphics();
    graphic.alpha = 1;
    const index = toIndex(r, c);

    const spotInfo: SpotInfo = {
      graphic,
      selected,
      spot,
      remove: false,
      radius: 0,
    };

    this.spotInfos.set(index, spotInfo);

    graphic.interactive = true;
    graphic.on('mouseover', () => {
      this.blockHandler.setSelectionPosition([r, c]);
    });

    this.drawSpot(spotInfo);
    this.uiLayer.addChild(graphic);

    return spotInfo;
  }

  private drawSpot(spotInfo: SpotInfo) {
    const { graphic, spot, selected } = spotInfo;
    const zoom = this.camera.getZoom();

    graphic.clear();
    graphic.lineStyle(1, colorFromSpotState(spot.status));
    graphic.drawCircle(0, 0, spotInfo.radius * zoom);

    const selectedRadius = CIRCLE_RADIUS * zoom + 2;

    if (selected) {
      graphic.lineStyle(2, 0xff00ff);
      graphic.drawCircle(0, 0, selectedRadius);
    }

    graphic.hitArea = new PIXI.Circle(0, 0, selectedRadius);

    const globalPoint = this.blockLayer.toGlobal(this.image.position);
    const newPoint = this.uiLayer.toLocal(globalPoint);

    graphic.x = newPoint.x + spot.x * zoom;
    graphic.y = newPoint.y + spot.y * zoom;
  }

  public updateSpots(): void {
    for (const [index, spotInfo] of this.spotInfos.entries()) {
      if (spotInfo.remove) {
        this.uiLayer.removeChild(spotInfo.graphic);
        this.spotInfos.delete(index);
      } else {
        this.drawSpot(spotInfo);
      }
    }
  }

  private updateStuff() {
    const spots = this.blockHandler.spots$.value;
    const selection = this.blockHandler.selectedSpots$.value;
    const toRemove = new Set(Array.from(this.spotInfos.keys()));

    forEach2d(spots, (spot, r, c) => {
      const index = toIndex(r, c);
      const selected = selection.includes(index);

      let spotInfo = this.spotInfos.get(index);

      if (spotInfo) {
        this.spotInfos.set(index, {
          graphic: spotInfo.graphic,
          selected,
          spot,
          remove: false,
          radius: spotInfo.radius,
        });
      } else {
        spotInfo = this.newSpotGraphic(r, c, spot, selected);
      }

      toRemove.delete(index);
    });

    toRemove.forEach((index) => {
      const spotInfo = this.spotInfos.get(index);
      if (spotInfo) {
        spotInfo.remove = true;
      }
    });

    this.updateSpots();
  }
}
