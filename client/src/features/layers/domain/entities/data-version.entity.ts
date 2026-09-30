export type DataVersionStatus = "PROCESSING" | "READY" | "FAILED";

export type DataVersion = {
  id: string;
  layerId: string;
  versionNumber: number;
  status: DataVersionStatus;
  sourceFilename: string;
  featureCount: number;
  errorMessage: string | null;
  isActive: boolean;
  createdAt: string;
};

export type ImportGeographicDataInput = {
  layerId: string;
  file: File;
};

export type ActivateDataVersionInput = {
  layerId: string;
  versionId: string;
};
