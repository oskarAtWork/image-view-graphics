export type LoadingProgress = {
  message: string;
  progress: number;
  request?: LoadingProgressRequest;
  section?: LoadingProgressSection;
};

type LoadingProgressRequest = 'UPDATE_SECTION' | 'UPDATE_LOADING_SECTION' | 'HIDE_PROGRESS';
type LoadingProgressSection = 'load-data';

export type IError = {
  message: string;
  stackTrace: string;
};
