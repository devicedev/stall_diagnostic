import type { ProblemDetailRow, ProblemStatisticsParams } from '../types/statistics';
import type { StallDiagnosticRow } from '../types/forms';
import { calculateAverages } from './calculate_average';

type ProblemDetailsPayload = ProblemDetailRow[] | ProblemDetailsResponse;

interface ProblemDetailsResponse {
  value?: Array<ProblemDetailRow | ProblemSummaryRow>;
}

interface ProblemSummaryRow {
  date: string;
  number_milking: number;
  problematic_meter_addresses?: number[];
}

const buildProblemQuery = (params: ProblemStatisticsParams) => {
  const queryParams = new URLSearchParams();
  queryParams.append('farm', params.farm);
  queryParams.append('dmb', String(params.dmb));
  queryParams.append('start_date', params.startDate);
  queryParams.append('end_date', params.endDate);
  return queryParams.toString();
};

export async function fetchProblemDetails(params: ProblemStatisticsParams): Promise<ProblemDetailRow[]> {
  const response = await fetch(`/api/v1/stall/diagnostic/problems?${buildProblemQuery(params)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить статистику: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ProblemDetailsPayload | ProblemSummaryRow[];
  const rows = Array.isArray(payload) ? payload : (payload.value ?? []);
  const detailRows = rows.filter(isProblemDetailRow);
  const summaryRows = rows.filter(isProblemSummaryRow);
  const normalizedRows = summaryRows.length > 0 ? await expandSummaryRows(summaryRows, params) : [];
  return [...detailRows, ...normalizedRows];
}

export async function exportProblemStatisticsExcel(params: ProblemStatisticsParams): Promise<void> {
  const response = await fetch(`/api/v1/stall/diagnostic/problems/excel?${buildProblemQuery(params)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Не удалось выгрузить Excel: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `problematic_stalls_${params.farm}_dmb${params.dmb}_${params.startDate}_${params.endDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

function isProblemDetailRow(row: ProblemDetailRow | ProblemSummaryRow): row is ProblemDetailRow {
  return 'meter_address' in row;
}

function isProblemSummaryRow(row: ProblemDetailRow | ProblemSummaryRow): row is ProblemSummaryRow {
  return !isProblemDetailRow(row);
}

async function expandSummaryRows(
  rows: ProblemSummaryRow[],
  params: ProblemStatisticsParams,
): Promise<ProblemDetailRow[]> {
  const expanded = await Promise.all(rows.map((row) => expandSummaryRow(row, params)));
  return expanded.flat();
}

async function expandSummaryRow(
  row: ProblemSummaryRow,
  params: ProblemStatisticsParams,
): Promise<ProblemDetailRow[]> {
  const diagnosticRows = await fetchDiagnosticRows({
    ...params,
    date: row.date,
    milking: row.number_milking,
  });

  if (diagnosticRows.length === 0) return normalizeProblemSummaryRow(row);

  const averages = calculateAverages(diagnosticRows);
  const problemMeters = new Set(row.problematic_meter_addresses ?? []);
  const rowsByMeter = new Map(
    diagnosticRows
      .filter((diagnosticRow) => diagnosticRow.meter_address !== null && diagnosticRow.meter_address !== undefined)
      .map((diagnosticRow) => [diagnosticRow.meter_address, diagnosticRow]),
  );

  return [...problemMeters].map((meterAddress) => {
    const diagnosticRow = rowsByMeter.get(meterAddress);
    if (!diagnosticRow) {
      return {
        date: row.date,
        number_milking: row.number_milking,
        meter_address: meterAddress,
        reasons: { is_problem: true },
      };
    }

    return {
      date: row.date,
      number_milking: row.number_milking,
      meter_address: meterAddress,
      reasons: {},
      milk_production: diagnosticRow.total_milk_production,
      avg_milk_production: averages.avgMilkProduction,
      reattachments: diagnosticRow.number_reattaches,
      avg_reattachments: averages.avgReattaches,
      manual_detach_count: diagnosticRow.manual_detach_count,
      avg_manual_detach_count: averages.avgManualDetaches,
      manual_mode_count: diagnosticRow.manual_mode_count,
      avg_manual_mode_count: averages.avgManualModes,
      total_amount_washed: diagnosticRow.total_amount_washed,
    };
  });
}

async function fetchDiagnosticRows(params: ProblemStatisticsParams & { date: string; milking: number }) {
  const queryParams = new URLSearchParams();
  queryParams.append('farm', params.farm);
  queryParams.append('dmb', String(params.dmb));
  queryParams.append('date', params.date);
  queryParams.append('milking', String(params.milking));

  const response = await fetch(`/api/v1/stall/diagnostic?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) return [];

  return (await response.json()) as StallDiagnosticRow[];
}

function normalizeProblemSummaryRow(row: ProblemSummaryRow): ProblemDetailRow[] {
  return (row.problematic_meter_addresses ?? []).map((meterAddress) => ({
    date: row.date,
    number_milking: row.number_milking,
    meter_address: meterAddress,
    reasons: { is_problem: true },
  }));
}
