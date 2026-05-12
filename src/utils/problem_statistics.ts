import type {
  MilkingFilter,
  ProblemDetailRow,
  ProblemStatisticsModel,
  ReasonCount,
  SummaryByDateRow,
  TopMeterRow,
} from '../types/statistics';

export const criticalReasonLabels = {
  milk: 'Низкий надой',
  reattach: 'Переподключения',
  manualDetach: 'Ручные отключения',
  manualMode: 'Ручные режимы',
} as const;

export const shipmentLabel = 'Отгрузки';

export function getShipmentValue(row: ProblemDetailRow): number | null {
  return typeof row.total_amount_washed === 'number' && row.total_amount_washed > 0
    ? row.total_amount_washed
    : null;
}

export function getCriticalReasonLabels(row: ProblemDetailRow): string[] {
  const labels: string[] = [];
  if (row.reasons.is_milk_problem || isMilkProblem(row)) labels.push(criticalReasonLabels.milk);
  if (row.reasons.is_reattach_problem || isReattachProblem(row)) labels.push(criticalReasonLabels.reattach);
  if (row.reasons.is_manual_detach_problem || isManualDetachProblem(row)) labels.push(criticalReasonLabels.manualDetach);
  if (row.reasons.is_manual_mode_problem || isManualModeProblem(row)) labels.push(criticalReasonLabels.manualMode);
  return labels;
}

export function hasCriticalReason(row: ProblemDetailRow): boolean {
  return getCriticalReasonLabels(row).length > 0 || row.reasons.is_problem === true;
}

export function buildProblemStatisticsModel(
  rows: ProblemDetailRow[],
  milkingFilter: MilkingFilter,
): ProblemStatisticsModel {
  const detailRows = rows.filter((row) => milkingFilter === 'all' || row.number_milking === milkingFilter);
  const criticalRows = detailRows.filter(hasCriticalReason);

  const reasonCounts: ReasonCount[] = [
    { key: 'milk', label: criticalReasonLabels.milk, count: 0, isCritical: true },
    { key: 'reattach', label: criticalReasonLabels.reattach, count: 0, isCritical: true },
    { key: 'manualDetach', label: criticalReasonLabels.manualDetach, count: 0, isCritical: true },
    { key: 'manualMode', label: criticalReasonLabels.manualMode, count: 0, isCritical: true },
  ];

  const increment = (key: ReasonCount['key']) => {
    const item = reasonCounts.find((reason) => reason.key === key);
    if (item) item.count += 1;
  };

  for (const row of detailRows) {
    const hasMilkProblem = row.reasons.is_milk_problem || isMilkProblem(row);
    const hasReattachProblem = row.reasons.is_reattach_problem || isReattachProblem(row);
    const hasManualDetachProblem = row.reasons.is_manual_detach_problem || isManualDetachProblem(row);
    const hasManualModeProblem = row.reasons.is_manual_mode_problem || isManualModeProblem(row);

    if (hasMilkProblem) increment('milk');
    if (hasReattachProblem) increment('reattach');
    if (hasManualDetachProblem) increment('manualDetach');
    if (hasManualModeProblem) increment('manualMode');
  }

  const problemDays = new Set(criticalRows.map((row) => row.date)).size;
  const uniqueProblemMeters = new Set(criticalRows.map((row) => row.meter_address)).size;
  const mostFrequentReason =
    reasonCounts
      .filter((row) => row.isCritical && row.count > 0)
      .sort((a, b) => b.count - a.count)[0] ?? null;

  return {
    detailRows,
    reasonCounts,
    summaryByDate: buildSummaryByDate(detailRows),
    topMeters: buildTopMeters(criticalRows),
    kpis: {
      criticalRecords: criticalRows.length,
      uniqueProblemMeters,
      problemDays,
      mostFrequentReason,
    },
  };
}

export function isMilkProblem(row: ProblemDetailRow): boolean {
  if (typeof row.milk_production !== 'number' || typeof row.avg_milk_production !== 'number') return false;
  const milk = row.milk_production ?? 0;
  return milk === 0 || milk <= 0.5 * (row.avg_milk_production ?? 0);
}

export function isReattachProblem(row: ProblemDetailRow): boolean {
  const value = row.reattachments ?? row.reattaches;
  const average = row.avg_reattachments ?? row.avg_reattaches ?? 0;
  return value !== null && value !== undefined && value !== 0 && value >= 1.5 * average && value > 9;
}

export function isManualDetachProblem(row: ProblemDetailRow): boolean {
  const value = row.manual_detach_count ?? row.manual_detaches;
  const average = row.avg_manual_detach_count ?? row.avg_manual_detaches ?? 0;
  return value !== null && value !== undefined && value !== 0 && value >= 1.5 * average && value > 9;
}

export function isManualModeProblem(row: ProblemDetailRow): boolean {
  const value = row.manual_mode_count ?? row.manual_modes;
  const average = row.avg_manual_mode_count ?? row.avg_manual_modes ?? 0;
  return value !== null && value !== undefined && value !== 0 && value >= 1.5 * average && value > 9;
}

function buildSummaryByDate(detailRows: ProblemDetailRow[]): SummaryByDateRow[] {
  const criticalRows = detailRows.filter(hasCriticalReason);
  const metersByDateMilking = new Map<string, Set<number>>();

  for (const row of criticalRows) {
    const key = `${row.date}|${row.number_milking}`;
    const problemMeters = metersByDateMilking.get(key) ?? new Set<number>();
    problemMeters.add(row.meter_address);
    metersByDateMilking.set(key, problemMeters);
  }

  return [...metersByDateMilking.entries()]
    .map(([key, problemMeters]) => {
      const [date, milking] = key.split('|');

      return {
        date,
        milking: Number(milking),
        problemMeters: [...problemMeters].sort((a, b) => a - b),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.milking - b.milking);
}

function buildTopMeters(criticalRows: ProblemDetailRow[]): TopMeterRow[] {
  const counts = new Map<number, number>();
  for (const row of criticalRows) {
    counts.set(row.meter_address, (counts.get(row.meter_address) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([meter, count]) => ({ meter, count }))
    .sort((a, b) => b.count - a.count || a.meter - b.meter)
    .slice(0, 10);
}
