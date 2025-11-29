export interface OCRResult {
  text: string;
  confidence?: number;
}

export enum TextDirection {
  RTL = 'rtl',
  LTR = 'ltr',
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  progress: string;
}