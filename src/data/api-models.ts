export type Severity = 'error' | 'warning' | 'info' | 'success';

export type InfoMessage = {
  title: string;
  message: string;
  severity: Severity;
};

export type ButtonInfo = {
  alignButton: boolean;
  dropButton: boolean;
  measureButton: boolean;
  okButton: boolean;
  discardButton: boolean;
};
