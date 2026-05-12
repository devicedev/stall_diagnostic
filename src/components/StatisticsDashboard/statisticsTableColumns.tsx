import type { ColumnDef } from '@tanstack/react-table';
import type { ProblemDetailRow, SummaryByDateRow } from '../../types/statistics';
import {
  getCriticalReasonLabels,
  isManualDetachProblem,
  isManualModeProblem,
  isMilkProblem,
  isReattachProblem,
} from '../../utils/problem_statistics';
import styles from './StatisticsDashboard.module.css';

const formatNumber = (value?: number | null) => (
  typeof value === 'number' ? value.toFixed(2) : '—'
);

const formatActualAverage = (actual?: number | null, average?: number | null) =>
  `${formatNumber(actual)} / ${formatNumber(average)}`;

const renderMetricCell = ({
  actual,
  average,
  isProblem,
}: {
  actual?: number | null;
  average?: number | null;
  isProblem: boolean;
}) => (
  <span
    className={isProblem ? styles.metricProblem : styles.metricValue}
    title={`Факт: ${formatNumber(actual)}; среднее: ${formatNumber(average)}`}
  >
    {isProblem && (
      <span className={styles.metricProblemIcon} aria-label="Отклонение">
        !
      </span>
    )}
    <span>{formatActualAverage(actual, average)}</span>
  </span>
);

export const detailColumns: ColumnDef<ProblemDetailRow>[] = [
  { accessorKey: 'date', header: 'Дата' },
  { accessorKey: 'number_milking', header: 'Доение' },
  { accessorKey: 'meter_address', header: 'Место' },
  {
    id: 'reasons',
    header: 'Причины',
    cell: ({ row }) => (
      <div className={styles.badgeList}>
        {getCriticalReasonLabels(row.original).map((label) => (
          <span key={label} className={styles.reasonBadge}>
            {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: 'milk',
    header: 'Надой факт / ср.',
    cell: ({ row }) =>
      renderMetricCell({
        actual: row.original.milk_production,
        average: row.original.avg_milk_production,
        isProblem: row.original.reasons.is_milk_problem === true || isMilkProblem(row.original),
      }),
  },
  {
    id: 'reattachments',
    header: 'Переподключения факт / ср.',
    cell: ({ row }) =>
      renderMetricCell({
        actual: row.original.reattachments ?? row.original.reattaches,
        average: row.original.avg_reattachments ?? row.original.avg_reattaches,
        isProblem: row.original.reasons.is_reattach_problem === true || isReattachProblem(row.original),
      }),
  },
  {
    id: 'manualDetach',
    header: 'Ручные отключения факт / ср.',
    cell: ({ row }) =>
      renderMetricCell({
        actual: row.original.manual_detach_count ?? row.original.manual_detaches,
        average: row.original.avg_manual_detach_count ?? row.original.avg_manual_detaches,
        isProblem: row.original.reasons.is_manual_detach_problem === true || isManualDetachProblem(row.original),
      }),
  },
  {
    id: 'manualMode',
    header: 'Ручные режимы факт / ср.',
    cell: ({ row }) =>
      renderMetricCell({
        actual: row.original.manual_mode_count ?? row.original.manual_modes,
        average: row.original.avg_manual_mode_count ?? row.original.avg_manual_modes,
        isProblem: row.original.reasons.is_manual_mode_problem === true || isManualModeProblem(row.original),
      }),
  },
  {
    id: 'deviations',
    header: 'Отклонения',
    cell: ({ row }) => getCriticalReasonLabels(row.original).length,
  },
];

export const summaryColumns: ColumnDef<SummaryByDateRow>[] = [
  { accessorKey: 'date', header: 'Дата' },
  { accessorKey: 'milking', header: 'Доение' },
  {
    accessorKey: 'problemMeters',
    header: 'Места',
    cell: ({ row }) => (
      <div className={styles.meterList} aria-label={`Места: ${row.original.problemMeters.join(', ')}`}>
        {row.original.problemMeters.map((meter) => (
          <span key={meter} className={styles.meterBadge}>
            {meter}
          </span>
        ))}
      </div>
    ),
  },
];
