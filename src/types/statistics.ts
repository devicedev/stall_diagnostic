export type MilkingFilter = 'all' | 1 | 2 | 3;

export interface ProblemReasons {
  is_problem?: boolean;
  is_milk_problem?: boolean;
  is_reattach_problem?: boolean;
  is_manual_detach_problem?: boolean;
  is_manual_mode_problem?: boolean;
}

export interface ProblemDetailRow {
  date: string;
  number_milking: number;
  meter_address: number;
  reasons: ProblemReasons;
  milk_production?: number | null;
  avg_milk_production?: number | null;
  reattachments?: number | null;
  avg_reattachments?: number | null;
  reattaches?: number | null;
  avg_reattaches?: number | null;
  manual_detach_count?: number | null;
  avg_manual_detach_count?: number | null;
  manual_detaches?: number | null;
  avg_manual_detaches?: number | null;
  manual_mode_count?: number | null;
  avg_manual_mode_count?: number | null;
  manual_modes?: number | null;
  avg_manual_modes?: number | null;
  total_amount_washed?: number | null;
}

export interface ProblemStatisticsParams {
  farm: string;
  dmb: number;
  startDate: string;
  endDate: string;
}

export interface KpiModel {
  criticalRecords: number;
  uniqueProblemMeters: number;
  problemDays: number;
  mostFrequentReason: ReasonCount | null;
}

export type ReasonKey = 'milk' | 'reattach' | 'manualDetach' | 'manualMode';

export interface ReasonCount {
  key: ReasonKey;
  label: string;
  count: number;
  isCritical: boolean;
}

export interface SummaryByDateRow {
  date: string;
  milking: number;
  problemMeters: number[];
}

export interface TopMeterRow {
  meter: number;
  count: number;
}

export interface ProblemStatisticsModel {
  detailRows: ProblemDetailRow[];
  reasonCounts: ReasonCount[];
  summaryByDate: SummaryByDateRow[];
  topMeters: TopMeterRow[];
  kpis: KpiModel;
}
