import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import ReactECharts from 'echarts-for-react';
import DataTable from '../DataTable/DataTable';
import type { MilkingFilter, ProblemDetailRow } from '../../types/statistics';
import { exportProblemStatisticsExcel, fetchProblemDetails } from '../../utils/problem_statistics_api';
import { buildProblemStatisticsModel } from '../../utils/problem_statistics';
import {
  buildProblemsByDateChartOption,
  buildReasonChartOption,
  buildTopMetersChartOption,
} from './statisticsCharts';
import { detailColumns, summaryColumns } from './statisticsTableColumns';
import styles from './StatisticsDashboard.module.css';

const dmbOptions: Record<string, number[]> = {
  Наровчат: [1, 2],
  Аршиновка: [1, 2, 3],
  Сердобск: [1, 2],
};
const farmOptions = Object.keys(dmbOptions);

type ActiveTab = 'details' | 'summary';

interface StatisticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  farm: string;
  initialDmb: number;
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const createDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};
const preventManualDateInput = (event?: { preventDefault: () => void }) => {
  event?.preventDefault();
};

interface DateButtonProps {
  label: string;
  value?: string;
  onClick?: () => void;
}

const DateButton = forwardRef<HTMLButtonElement, DateButtonProps>(({ label, value, onClick }, ref) => (
  <button ref={ref} className={styles.dateButton} onClick={onClick} type="button" aria-label={label}>
    {value}
  </button>
));
DateButton.displayName = 'DateButton';

export default function StatisticsDashboard({ isOpen, onClose, farm, initialDmb }: StatisticsDashboardProps) {
  const [selectedFarm, setSelectedFarm] = useState(farm);
  const [selectedDmb, setSelectedDmb] = useState(initialDmb);
  const [milkingFilter, setMilkingFilter] = useState<MilkingFilter>('all');
  const [startDate, setStartDate] = useState(() => createDaysAgo(6));
  const [endDate, setEndDate] = useState(() => new Date());
  const [rows, setRows] = useState<ProblemDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('details');

  useEffect(() => {
    setSelectedFarm(farm);
    setSelectedDmb(initialDmb);
  }, [farm, initialDmb]);

  const loadRows = useCallback(async () => {
    if (startDate > endDate) {
      setError('Начальная дата не может быть позже конечной');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const nextRows = await fetchProblemDetails({
        farm: selectedFarm,
        dmb: selectedDmb,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });
      setRows(nextRows);
      setActiveTab('details');
    } catch (requestError) {
      setRows([]);
      setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить статистику');
    } finally {
      setIsLoading(false);
    }
  }, [endDate, selectedDmb, selectedFarm, startDate]);

  useEffect(() => {
    if (isOpen) void loadRows();
  }, [isOpen, loadRows]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalScrollbarGutter = document.documentElement.style.scrollbarGutter;

    document.documentElement.style.scrollbarGutter = 'stable';

    return () => {
      document.documentElement.style.scrollbarGutter = originalScrollbarGutter;
    };
  }, [isOpen]);

  const model = useMemo(() => buildProblemStatisticsModel(rows, milkingFilter), [milkingFilter, rows]);
  const reasonChartOption = useMemo(() => buildReasonChartOption(model), [model]);
  const problemsByDateChartOption = useMemo(
    () => buildProblemsByDateChartOption(model, formatDate(startDate), formatDate(endDate)),
    [endDate, model, startDate],
  );
  const topMetersChartOption = useMemo(() => buildTopMetersChartOption(model), [model]);

  if (!isOpen) return null;

  const availableDmbOptions = dmbOptions[selectedFarm] ?? [initialDmb];
  const mostFrequentReason = model.kpis.mostFrequentReason;

  const handleFarmChange = (nextFarm: string) => {
    setSelectedFarm(nextFarm);
    setSelectedDmb(dmbOptions[nextFarm]?.[0] ?? initialDmb);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportProblemStatisticsExcel({
        farm: selectedFarm,
        dmb: selectedDmb,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });
    } catch (exportError) {
      alert(exportError instanceof Error ? exportError.message : 'Произошла ошибка при выгрузке отчета');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section className={styles.dashboard} onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <header className={styles.header}>
          <div>
            <h2>Статистика проблемных мест</h2>
            <p>{selectedFarm}</p>
          </div>

          <div className={styles.headerControls}>
            <div className={styles.filters}>
              <div className={styles.filterField}>
                <span>Хозяйство</span>
                <select aria-label="Хозяйство" value={selectedFarm} onChange={(event) => handleFarmChange(event.target.value)}>
                  {farmOptions.map((farmOption) => (
                    <option key={farmOption} value={farmOption}>
                      {farmOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <span>ДМБ</span>
                <select
                  aria-label="ДМБ"
                  value={selectedDmb}
                  onChange={(event) => setSelectedDmb(Number(event.target.value))}
                >
                  {availableDmbOptions.map((dmb) => (
                    <option key={dmb} value={dmb}>
                    {dmb}
                  </option>
                ))}
              </select>
              </div>

              <div className={styles.filterField}>
                <span>Доение</span>
                <select
                  aria-label="Доение"
                  value={milkingFilter}
                  onChange={(event) => {
                    setMilkingFilter(event.target.value === 'all' ? 'all' : (Number(event.target.value) as MilkingFilter));
                  }}
                >
                  <option value="all">Все</option>
                  <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              </div>

              <div className={styles.dateField}>
                <span>Начало</span>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => date && setStartDate(date)}
                  onChangeRaw={preventManualDateInput}
                  dateFormat="yyyy-MM-dd"
                  maxDate={endDate}
                  customInput={<DateButton label="Начало" />}
                  disabledKeyboardNavigation
                  popperClassName={styles.datePopper}
                  portalId="statistics-dashboard-date-portal"
                  popperPlacement="bottom-end"
                  showPopperArrow={false}
                />
              </div>

              <div className={styles.dateField}>
                <span>Конец</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => date && setEndDate(date)}
                  onChangeRaw={preventManualDateInput}
                  dateFormat="yyyy-MM-dd"
                  minDate={startDate}
                  maxDate={new Date()}
                  customInput={<DateButton label="Конец" />}
                  disabledKeyboardNavigation
                  popperClassName={styles.datePopper}
                  portalId="statistics-dashboard-date-portal"
                  popperPlacement="bottom-end"
                  showPopperArrow={false}
                />
              </div>

              <button className={styles.secondaryButton} onClick={handleExport} disabled={isExporting} type="button">
                {isExporting ? 'Экспорт...' : 'Excel'}
              </button>
            </div>

            <button className={styles.closeButton} onClick={onClose} type="button" aria-label="Закрыть" />
          </div>
        </header>

        {isLoading && <div className={styles.state}>Загрузка статистики...</div>}

        {!isLoading && error && (
          <div className={styles.state}>
            <h3>Не удалось загрузить статистику</h3>
            <p>{error}</p>
            <button className={styles.primaryButton} onClick={loadRows} type="button">
              Повторить
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <section className={styles.kpis} aria-label="Ключевые показатели">
              <div>
                <span>Всего критичных записей</span>
                <strong>{model.kpis.criticalRecords}</strong>
              </div>
              <div>
                <span>Всего дней с проблемами</span>
                <strong>{model.kpis.problemDays}</strong>
              </div>
              <div>
                <span>Самая частая причина</span>
                <strong>{mostFrequentReason ? `${mostFrequentReason.label}: ${mostFrequentReason.count}` : 'Нет данных'}</strong>
              </div>
              <div className={styles.uniqueKpi}>
                <span>Уникальных проблемных мест</span>
                <strong>{model.kpis.uniqueProblemMeters}</strong>
              </div>
            </section>

            <section className={styles.charts} aria-label="Графики статистики">
              <div className={styles.chartPanel}>
                <ReactECharts option={reasonChartOption} style={{ height: 260 }} />
              </div>
              <div className={styles.chartPanel}>
                <ReactECharts option={problemsByDateChartOption} style={{ height: 260 }} />
              </div>
              <div className={styles.chartPanel}>
                <ReactECharts option={topMetersChartOption} style={{ height: 260 }} />
              </div>
            </section>

            <nav className={styles.tabs} aria-label="Разделы статистики">
              <button
                className={activeTab === 'details' ? styles.activeTab : ''}
                onClick={() => setActiveTab('details')}
                type="button"
              >
                Проблемные места детально
              </button>
              <button
                className={activeTab === 'summary' ? styles.activeTab : ''}
                onClick={() => setActiveTab('summary')}
                type="button"
              >
                Сводка по датам
              </button>
            </nav>

            <section className={styles.tableSection}>
              {activeTab === 'details' && (
                <DataTable columns={detailColumns} data={model.detailRows} pageSize={25} emptyMessage="Нет проблемных записей" />
              )}
              {activeTab === 'summary' && (
                <DataTable columns={summaryColumns} data={model.summaryByDate} pageSize={15} emptyMessage="Нет сводных строк" />
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
