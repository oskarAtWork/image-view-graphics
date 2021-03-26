import * as PIXI from 'pixi.js';
import { takeUntil } from 'rxjs/operators';
import { Camera } from '../camera';
import { colorFromBlockState } from '../data/color';
import { Unsubcribe } from '../data/rxjs-types';
import { BlockResource } from '../state/slide-handler';

import { SlideHandler } from '../state/slide-handler';

type SelectionSquare = {
  graphic: PIXI.Graphics;
  index: number;
  image: PIXI.Sprite | null;
};
export class SlideView {
  private selectionSquare: SelectionSquare = { graphic: new PIXI.Graphics(), index: -1, image: null };
  public contentSize: [number, number];

  public constructor(
    private slideState: SlideHandler,
    private slideLayer: PIXI.Container,
    private slideUiLayer: PIXI.Container,
    private unsub: Unsubcribe,
    blocks: BlockResource[],
    private camera: Camera
  ) {
    this.slideLayer.on('mouseout', () => {
      slideState.setHighlighted(-1);
    });

    this.contentSize = blocks
      .map((res): [number, number] => [res.image.x + res.image.width, res.image.y + res.image.height])
      .reduce(([w, h], [w2, h2]) => {
        return [Math.max(w, w2), Math.max(h, h2)];
      });

    blocks.map((block) => {
      this.slideLayer.addChild(block.image);
    });

    this.slideUiLayer.addChild(this.selectionSquare.graphic);
    this.setUpSubscriptionListeners();
  }

  public updateUi(): void {
    const { graphic, index, image } = this.selectionSquare;

    if (image && index >= 0) {
      const [panX, panY] = this.camera.getPan();
      const zoom = this.camera.getZoom();

      graphic.clear();
      graphic.lineStyle(1, 0x0fd012);
      graphic.drawRect(0, 0, image.width * zoom, image.height * zoom);
      graphic.x = panX + image.x * zoom;
      graphic.y = panY + image.y * zoom;
      graphic.visible = true;
    } else {
      graphic.visible = false;
    }
  }

  private setUpSubscriptionListeners(): void {
    this.slideState.highlighted$.pipe(takeUntil(this.unsub)).subscribe((highlighted) => {
      const block = this.slideState.getBlockResource(highlighted);

      this.selectionSquare = {
        ...this.selectionSquare,
        index: block ? highlighted : -1,
        image: block ? block.image : null,
      };

      this.updateUi();
    });

    this.slideState.blockResources$.pipe(takeUntil(this.unsub)).subscribe((blockResources) => {
      blockResources.forEach(({ image, current }) => {
        image.tint = colorFromBlockState(current.state);
      });
    });
  }
}
