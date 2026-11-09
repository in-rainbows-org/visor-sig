declare module 'runonweb/ocr' {
  export type OCRSize = 'tiny' | 'small' | 'medium';
  export type Device = 'auto' | 'webgpu' | 'wasm';
  export type ResolvedDevice = 'webgpu' | 'wasm';

  export interface ProgressInfo {
    status: 'loading' | 'ready' | string;
    progress: number;
  }

  export type ProgressCallback = (info: ProgressInfo) => void;

  export interface OCROptions {
    size?: OCRSize;
    device?: Device;
    onProgress?: ProgressCallback;
  }

  export type OCRImageInput =
    | Blob
    | File
    | string
    | HTMLImageElement
    | ImageData
    | HTMLCanvasElement;

  export interface OCRBox {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  }

  export interface OCRLine {
    text: string;
    score: number;
    box: OCRBox;
  }

  export interface OCRResult {
    text: string;
    lines: OCRLine[];
    confidence: number;
  }

  export class OCR {
    constructor(options?: OCROptions);
    get size(): OCRSize;
    get device(): ResolvedDevice | null;
    load(): Promise<void>;
    read(image: OCRImageInput): Promise<OCRResult>;
    dispose(): Promise<void>;
  }
}
