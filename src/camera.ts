import * as PIXI from 'pixi.js';
import { BehaviorSubject } from 'rxjs';
import { PADDING, ZOOM } from './data/constants';
import { Zoom } from './data/zoom';

export type CameraState = {
  pan: [number, number];
  zoom: number;
};

type Animation = {
  t: number;
  duration: number;
  onProgress: (completion: number) => void;
  onEnd?: () => void;
};

type Focus = {
  container: PIXI.Container;
  width: number;
  height: number;
  x: number;
  y: number;
};

const boundZoom = (zoom: number): number => Math.min(ZOOM.max, Math.max(ZOOM.min, zoom));

export class Camera {
  private zoomPoint: [number, number] = [0, 0];
  private tempPoint = new PIXI.Point();
  private animation: Animation | null = null;
  private currentFocus: Focus | null = null;
  public windowSize$: BehaviorSubject<[number, number]>;
  public panAndZoom$ = new BehaviorSubject<CameraState>({
    zoom: 1,
    pan: [0, 0],
  });
  private dragStart: null | [number, number] = null;

  private zoomListeners: [PIXI.InteractionEventTypes, (e: PIXI.InteractionEvent) => void][] = [
    ['mousemove', this.setZoomPoint.bind(this)],
  ];

  private panListeners: [PIXI.InteractionEventTypes, (e: PIXI.InteractionEvent) => void][] = [
    ['mousedown', this.onDragStart.bind(this)],
    ['touchstart', this.onDragStart.bind(this)],
    ['mouseup', this.onDragEnd.bind(this)],
    ['mouseupoutside', this.onDragEnd.bind(this)],
    ['touchend', this.onDragEnd.bind(this)],
    ['touchendoutside', this.onDragEnd.bind(this)],
    ['mousemove', this.onDragMove.bind(this)],
    ['touchmove', this.onDragMove.bind(this)],
  ];

  private container: PIXI.Container | null = null;

  public constructor() {
    this.windowSize$ = new BehaviorSubject<[number, number]>([1, 1]);
  }

  public connectToView(container: PIXI.Container): void {
    this.container = container;
    for (const [eventType, fn] of this.panListeners) {
      this.container.on(eventType, fn);
    }
  }

  private boundPan(zoom: number, pan: [number, number]): [number, number] {
    if (!this.currentFocus || zoom === 0) {
      return pan;
    }

    const x = this.currentFocus.x * zoom;
    const y = this.currentFocus.y * zoom;

    const fw = this.currentFocus.width;
    const fh = this.currentFocus.height;
    const [w, h] = this.windowSize$.value;

    const offset = Math.max(20, 20 * zoom);

    const maxRight = -x + w - offset;
    const maxLeft = -x - fw * zoom + offset;
    const panX = Math.max(maxLeft, Math.min(maxRight, pan[0]));

    const maxBottom = -y + h - offset;
    const maxTop = -y - fh * zoom + offset;
    const panY = Math.max(maxTop, Math.min(maxBottom, pan[1]));

    return [panX, panY];
  }

  private setZoomPoint(e: PIXI.InteractionEvent) {
    if (!this.currentFocus) return;

    e.data.getLocalPosition(this.currentFocus.container, this.tempPoint);
    this.zoomPoint = [this.tempPoint.x, this.tempPoint.y];
  }

  public isAnimating(): boolean {
    return this.animation ? true : false;
  }

  public setFocus(container: PIXI.Container, x: number, y: number, width: number, height: number): void {
    if (this.currentFocus) {
      for (const [eventType, fn] of this.zoomListeners) {
        this.currentFocus.container.removeListener(eventType, fn);
      }
    }

    this.currentFocus = {
      container,
      width,
      height,
      x,
      y,
    };

    for (const [eventType, fn] of this.zoomListeners) {
      this.currentFocus.container.on(eventType, fn);
    }
  }

  public getZoom(): number {
    return this.panAndZoom$.value.zoom;
  }

  public getPan(): [number, number] {
    return this.panAndZoom$.value.pan;
  }

  public setWindowSize(newWindowWidth: number, newWindowHeight: number): boolean {
    const [oldWindowWidth, oldWindowHeight] = this.windowSize$.value;

    if (oldWindowWidth === newWindowWidth && oldWindowHeight === newWindowHeight) {
      return false;
    }

    this.windowSize$.next([newWindowWidth, newWindowHeight]);

    if (!this.currentFocus) {
      return false;
    }

    const zoom = this.getZoom();

    const [panX, panY] = this.getPan();

    const oldHalfWidth = (this.currentFocus.width / 2) * zoom;
    const newHalfWidth = oldHalfWidth * (newWindowWidth / oldWindowWidth);

    const oldHalfHeight = (this.currentFocus.height / 2) * zoom;
    const newHalfHeight = oldHalfHeight * (newWindowHeight / oldWindowHeight);

    const newPanX = panX * (newWindowWidth / oldWindowWidth) + newHalfWidth - oldHalfWidth;
    const newPanY = panY * (newWindowHeight / oldWindowHeight) + newHalfHeight - oldHalfHeight;

    this.nextPanAndZoom(zoom, [newPanX, newPanY]);

    return true;
  }

  public static calculateFramedView(
    contentX: number,
    contentY: number,
    contentWidth: number,
    contentHeight: number,
    windowWidth: number,
    windowHeight: number
  ): CameraState {
    const innerWindowWidth = windowWidth - PADDING.left - PADDING.right;
    const innerWindowHeight = windowHeight - PADDING.top - PADDING.bottom;

    const zoom = boundZoom(Math.min(innerWindowWidth / contentWidth, innerWindowHeight / contentHeight));

    const restX = Math.max(0, innerWindowWidth - zoom * contentWidth);
    const restY = Math.max(0, innerWindowHeight - zoom * contentHeight);

    return {
      pan: [-contentX * zoom + restX / 2 + PADDING.left, -contentY * zoom + restY / 2 + PADDING.top],
      zoom,
    };
  }

  public performZoom(zoom: Zoom): void {
    const rawZoom = zoom.change === 'multiply' ? this.getZoom() * zoom.value : zoom.value;
    const zoomValue = boundZoom(rawZoom);
    this.onDragEnd();

    if (zoom.behaviour === 'to_center') {
      if (!this.currentFocus) {
        return;
      }

      const [windowW, windowH] = this.windowSize$.value;
      const globalPoint = new PIXI.Point(windowW / 2, windowH / 2);
      this.currentFocus.container.toLocal(globalPoint, undefined, this.tempPoint, true);

      this.zoomTo(zoomValue, this.tempPoint.x, this.tempPoint.y);
    } else if (zoom.behaviour === 'to_mouse') {
      const [zx, zy] = this.zoomPoint;
      this.zoomTo(zoomValue, zx, zy);
    } else if (zoom.behaviour === 'reset') {
      if (this.currentFocus) {
        const cameraState = Camera.calculateFramedView(
          this.currentFocus.x,
          this.currentFocus.y,
          this.currentFocus.width,
          this.currentFocus.height,
          this.windowSize$.value[0],
          this.windowSize$.value[1]
        );

        this.nextPanAndZoom(cameraState.zoom, cameraState.pan);
      }
    } else {
      this.nextPanAndZoom(zoomValue, this.panAndZoom$.value.pan);
    }
  }

  private nextPanAndZoom(zoom: number, pan: [number, number]) {
    const bZoom = boundZoom(zoom);
    this.panAndZoom$.next({
      ...this.panAndZoom$.value,
      zoom: bZoom,
      pan: this.boundPan(bZoom, pan),
    });
  }

  private zoomTo(newZoom: number, zx: number, zy: number): void {
    const boundedZoom = boundZoom(newZoom);

    const { zoom, pan } = this.panAndZoom$.value;
    const zoomChange = zoom - boundedZoom;
    this.nextPanAndZoom(boundedZoom, [pan[0] + zx * zoomChange, pan[1] + zy * zoomChange]);
  }

  private onDragStart(event: PIXI.InteractionEvent): void {
    const { x, y } = event.data.global;
    const [panX, panY] = this.panAndZoom$.value.pan;
    this.dragStart = [panX - x, panY - y];
  }

  private onDragEnd(): void {
    this.dragStart = null;
  }

  private onDragMove(event: PIXI.InteractionEvent): void {
    if (this.dragStart) {
      const { x, y } = event.data.global;
      this.nextPanAndZoom(this.panAndZoom$.value.zoom, [x + this.dragStart[0], y + this.dragStart[1]]);
    }
  }

  public startAnimation(duration: number, onProgress: (t: number) => void, onEnd?: () => void): void {
    this.animation = {
      t: 0,
      duration,
      onProgress,
      onEnd,
    };
  }

  public static interpolate(from: CameraState, t: number, to: CameraState): CameraState {
    const panX = from.pan[0] * (1 - t) + to.pan[0] * t;
    const panY = from.pan[1] * (1 - t) + to.pan[1] * t;
    const zoom = from.zoom * (1 - t) + to.zoom * t;

    return {
      pan: [panX, panY],
      zoom,
    };
  }

  public animationTick(): void {
    if (!this.animation) {
      return;
    }

    this.animation.t = Math.min(this.animation.duration, this.animation.t + 1);
    this.animation.onProgress(this.animation.t / this.animation.duration);

    if (this.animation.t === this.animation.duration) {
      const temp = this.animation;
      this.animation = null;
      if (temp.onEnd) temp.onEnd();
    }
  }
}
