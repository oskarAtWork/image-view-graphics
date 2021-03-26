import { ButtonInfo } from './api-models';

export const ON_LOAD_GRID_STATE_FAILED_BUTTON_INFO: ButtonInfo = {
  okButton: false,
  discardButton: true,
  measureButton: false,
  alignButton: true,
  dropButton: false,
};

export const SUCCESS_BUTTON_INFO: ButtonInfo = {
  okButton: false,
  discardButton: false,
  measureButton: false,
  alignButton: true,
  dropButton: false,
};

export const ON_LOAD_GRID_STATE_AFTER_PYTHON: ButtonInfo = {
  okButton: true,
  discardButton: false,
  measureButton: true,
  alignButton: false,
  dropButton: false,
};
