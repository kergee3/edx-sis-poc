export interface LoginHistoryDetailRow {
  label: string;
  value: string;
}

export interface LoginHistoryDetail {
  server: LoginHistoryDetailRow[];
  client: LoginHistoryDetailRow[];
}

export interface LoginHistoryView {
  id: string;
  loggedInAtDate: string;
  loggedInAtTime: string;
  locationLabel: string;
  ipLabel: string;
  osLabel: string;
  browserLabel: string;
  detail: LoginHistoryDetail;
}

export type { ClientEnrichment } from '../schema/enrichment';
