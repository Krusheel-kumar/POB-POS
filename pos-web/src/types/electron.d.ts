export interface ElectronPrinter {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface SilentPrintOptions {
  printerName?: string;
  silent?: boolean;
  copies?: number;
}

export interface ElectronAPI {
  isElectron: boolean;
  getPrinters: () => Promise<ElectronPrinter[]>;
  silentPrint: (options?: SilentPrintOptions) => Promise<{ success: boolean; failureReason?: string }>;
  silentPrintHtml: (options: { html: string; printerName?: string; silent?: boolean; copies?: number }) => Promise<{ success: boolean; failureReason?: string }>;
  toggleFullscreen: () => Promise<boolean>;
  getVersion: () => Promise<string>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
