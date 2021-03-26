import { API } from './api';

import { BlockResource, SlideHandler } from './slide-handler';
import { EffectMessage } from '../data/effects';
import { Camera } from '../camera';
import { filter, takeUntil } from 'rxjs/operators';
import { BlockHandler } from '../state/block-handler';
import { isDefined } from '../helpers/list-helpers';
import { SlidesService } from './slide-service';
import { Unsubcribe } from '../data/rxjs-types';
import { Block } from '../data/models';

export function handleEffects(
  blockHandler: BlockHandler,
  slideService: SlidesService,
  slideHandler: SlideHandler,
  api: API,
  camera: Camera,
  slide: string,
  unsubscribe: Unsubcribe
): void {
  api.mutableEffect$.pipe(takeUntil(unsubscribe)).subscribe(({ message }) => {
    perform(slide, blockHandler, slideService, slideHandler, camera, message, api);
  });

  slideHandler.selected$.pipe(takeUntil(unsubscribe)).subscribe((selected) => api.inBlockMode$.next(selected >= 0));
  api.zoomEffects$.pipe(filter(isDefined), takeUntil(unsubscribe)).subscribe((zoom) => camera.performZoom(zoom));
  camera.panAndZoom$.pipe(takeUntil(unsubscribe)).subscribe(({ zoom }) => api.zoom$.next(zoom));

  const pipefocus = () => {
    const focused = slideHandler.getSelectedBlockResource() || slideHandler.getHighlightedBlock();
    api.focusedBlock$.next(focused);
  };

  slideHandler.highlighted$.pipe(takeUntil(unsubscribe)).subscribe(pipefocus);
  slideHandler.selected$.pipe(takeUntil(unsubscribe)).subscribe(pipefocus);
}

function perform(
  slide: string,
  blockHandler: BlockHandler,
  slideService: SlidesService,
  slideHandler: SlideHandler,
  camera: Camera,
  message: EffectMessage,
  api: API
) {
  console.log({ message });
  if (message === 'ZOOM_IN') {
    camera.performZoom({
      value: 1.4,
      behaviour: 'to_center',
      change: 'multiply',
    });
  } else if (message === 'ZOOM_OUT') {
    camera.performZoom({
      value: 1 / 1.4,
      behaviour: 'to_center',
      change: 'multiply',
    });
  } else if (message === 'OPEN_BLOCK_VIEW') {
    slideHandler.setSelectedToHighlighted();
  } else if (message === 'OPEN_SLIDE_VIEW') {
    const status = blockHandler.modified$.value ? 'WORKING' : undefined;
    slideHandler.gotoSlideView(blockHandler, status);
  } else if (message === 'MOVE_HIGHLIGHTED_DOWN') {
    slideHandler.moveHighlighted(0, 1);
  } else if (message === 'MOVE_HIGHLIGHTED_UP') {
    slideHandler.moveHighlighted(0, -1);
  } else if (message === 'MOVE_HIGHLIGHTED_LEFT') {
    slideHandler.moveHighlighted(-1, 0);
  } else if (message === 'MOVE_HIGHLIGHTED_RIGHT') {
    slideHandler.moveHighlighted(1, 0);
  } else if (message === 'GO_TO_NEXT_BLOCK') {
    slideHandler.changeSelected(1);
  } else if (message === 'GO_TO_PREVIOUS_BLOCK') {
    slideHandler.changeSelected(-1);
  } else if (message === 'ROLLBACK') {
    slideHandler.rollback();
  } else if (message === 'MOVE_SELECTION_POS_DOWN') {
    blockHandler.setSelectionPosition([0, 1]);
  } else if (message === 'MOVE_SELECTION_POS_LEFT') {
    blockHandler.setSelectionPosition([-1, 0]);
  } else if (message === 'MOVE_SELECTION_POS_RIGHT') {
    blockHandler.setSelectionPosition([1, 0]);
  } else if (message === 'MOVE_SELECTION_POS_UP') {
    blockHandler.setSelectionPosition([0, -1]);
  } else if (message === 'MOVE_SELECTED_POINTS_DOWN') {
    blockHandler.moveSpots(0, 1);
  } else if (message === 'MOVE_SELECTED_POINTS_UP') {
    blockHandler.moveSpots(0, -1);
  } else if (message === 'MOVE_SELECTED_POINTS_LEFT') {
    blockHandler.moveSpots(-1, 0);
  } else if (message === 'MOVE_SELECTED_POINTS_RIGHT') {
    blockHandler.moveSpots(1, 0);
  } else if (message === 'TOGGLE_POS_FAIL') {
    blockHandler.toggleSpotStatus('POS_FAIL');
  } else if (message === 'TOGGLE_NO_SIGNAL') {
    blockHandler.toggleSpotStatus('NO_SIGNAL');
  } else if (message === 'TOGGLE_ROW_SELECTION_MODE') {
    blockHandler.toggleSelectionMode('row');
  } else if (message === 'TOGGLE_ALL_SELECTION_MODE') {
    blockHandler.toggleSelectionMode('all');
  } else if (message === 'MARK_BLOCK_AS_OK') {
    slideHandler.gotoSlideView(blockHandler, 'OK');
  } else if (message === 'MARK_BLOCK_AS_DISCARDED') {
    slideHandler.gotoSlideView(blockHandler, 'DISCARD');
  } else if (message === 'RESET_BLOCK') {
    slideHandler.resetBlock();
  } else if (message === 'SAVE_GRID') {
    if (!api.isLoading$.value) {
      const blocks = slideHandler.getBlocksForSave();
      api.isLoading$.next(true);
      slideService
        .saveBlocks(slide, blocks)
        .catch((error) => {
          console.error(error);
        })
        .then(() => {
          slideHandler.updateInitial(blocks.map(([name]) => name));
          api.isLoading$.next(false);
        });
    }
  } else if (message === 'PERFORM_GRID_MEASURE') {
    blockCall(slide, slideHandler, blockHandler, slideService.measureGrid.bind(slideService), api);
  } else if (message === 'PERFORM_DROP_GRID') {
    blockCall(slide, slideHandler, blockHandler, slideService.dropGrid.bind(slideService), api);
  } else if (message === 'PERFORM_GRID_ALIGN') {
    blockCall(slide, slideHandler, blockHandler, slideService.alignGrid.bind(slideService), api);
  }
}

const blockCall = (
  slide: string,
  slideHandler: SlideHandler,
  blockHandler: BlockHandler,
  promiseFn: (slide: string, blockResource: BlockResource) => Promise<Block | null>,
  api: API
) => {
  const blockResource = slideHandler.getSelectedBlockResource();

  if (blockResource && !api.isLoading()) {
    api.isLoading$.next(true);
    promiseFn(slide, blockResource).then((block) => {
      api.isLoading$.next(false);
      if (block) {
        api.infoMessage$.next({
          title: 'Success',
          message: 'Block successfully updated',
          severity: 'success',
        });
        slideHandler.updateBlock(blockResource.name, block);
        blockHandler.setSpots(block.data);
        blockHandler.update();
      }
    });
  }
};
