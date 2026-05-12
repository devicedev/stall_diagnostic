import type { EChartsOption } from 'echarts';
import type { ProblemStatisticsModel } from '../../types/statistics';

const criticalColor = '#b42318';
const dateTrendColor = '#2563eb';
const neutralColor = '#98a2b3';
const topMeterColor = '#047857';
const axisColor = '#667085';
const gridColor = '#edf0f4';
const titleTextStyle = { fontSize: 13, fontWeight: 700, color: '#111827' } as const;

type TooltipParam = {
  axisValue?: string | number;
  data?: number | string | { value?: number | string };
  marker?: string;
  name?: string;
  value?: number | string;
};

const getTooltipParam = (params: unknown): TooltipParam | null => {
  if (Array.isArray(params)) return (params[0] as TooltipParam | undefined) ?? null;
  if (params && typeof params === 'object') return params as TooltipParam;
  return null;
};

const getTooltipValue = (param: TooltipParam | null) => {
  if (!param) return 0;
  if (param.data && typeof param.data === 'object' && 'value' in param.data) return param.data.value ?? 0;
  return param.value ?? param.data ?? 0;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (date: string) => date.slice(5);

const getDateAxisLabelInterval = (dateCount: number) => Math.max(0, Math.ceil(dateCount / 9) - 1);

export function buildReasonChartOption(model: ProblemStatisticsModel): EChartsOption {
  return {
    title: { text: 'Причины', left: 0, textStyle: titleTextStyle },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const param = getTooltipParam(params);
        const label = param?.axisValue ?? param?.name ?? '';
        const value = getTooltipValue(param);
        return `${param?.marker ?? ''}${label}<br/>Критичных записей: ${value}`;
      },
    },
    grid: { left: 36, right: 12, top: 42, bottom: 58 },
    xAxis: {
      type: 'category',
      data: model.reasonCounts.map((row) => row.label),
      axisLine: { lineStyle: { color: gridColor } },
      axisTick: { lineStyle: { color: gridColor } },
      axisLabel: { color: axisColor, fontSize: 11, interval: 0, rotate: 25 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: axisColor, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: model.reasonCounts.map((row) => ({
          value: row.count,
          itemStyle: { color: row.isCritical ? criticalColor : neutralColor },
        })),
        barMaxWidth: 36,
      },
    ],
  };
}

const createDateRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export function buildProblemsByDateChartOption(
  model: ProblemStatisticsModel,
  startDate: string,
  endDate: string,
): EChartsOption {
  const problemsByDate = new Map<string, number>();
  for (const row of model.summaryByDate) {
    problemsByDate.set(row.date, (problemsByDate.get(row.date) ?? 0) + row.problemMeters.length);
  }

  const summaryGroups = createDateRange(startDate, endDate).map((date) => ({
    date,
    count: problemsByDate.get(date) ?? 0,
  }));
  const dateLabelInterval = getDateAxisLabelInterval(summaryGroups.length);

  return {
    title: { text: 'Проблемы по датам', left: 0, textStyle: titleTextStyle },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const param = getTooltipParam(params);
        const date = param?.axisValue ?? param?.name ?? '';
        const value = getTooltipValue(param);
        return `${param?.marker ?? ''}Дата: ${date}<br/>Проблемных мест: ${value}`;
      },
    },
    grid: { left: 36, right: 12, top: 42, bottom: 58 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: summaryGroups.map((row) => row.date),
      axisLine: { lineStyle: { color: gridColor } },
      axisTick: { lineStyle: { color: gridColor } },
      axisLabel: {
        color: axisColor,
        fontSize: 11,
        formatter: formatShortDate,
        hideOverlap: true,
        interval: dateLabelInterval,
        rotate: 25,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: axisColor, fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        smooth: 0.45,
        showSymbol: false,
        data: summaryGroups.map((row) => row.count),
        lineStyle: { color: dateTrendColor, width: 2 },
        areaStyle: { color: 'rgba(37, 99, 235, 0.08)' },
      },
    ],
  };
}

export function buildTopMetersChartOption(model: ProblemStatisticsModel): EChartsOption {
  return {
    title: { text: 'Топ мест', left: 0, textStyle: titleTextStyle },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const param = getTooltipParam(params);
        const label = param?.axisValue ?? param?.name ?? '';
        const value = getTooltipValue(param);
        return `${param?.marker ?? ''}${label}<br/>Повторов за период: ${value}`;
      },
    },
    grid: { left: 36, right: 12, top: 42, bottom: 58 },
    xAxis: {
      type: 'category',
      data: model.topMeters.map((row) => `Место ${row.meter}`),
      axisLine: { lineStyle: { color: gridColor } },
      axisTick: { lineStyle: { color: gridColor } },
      axisLabel: { color: axisColor, fontSize: 11, interval: 0, rotate: 25 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: axisColor, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: model.topMeters.map((row) => row.count),
        itemStyle: { color: topMeterColor },
        barMaxWidth: 36,
      },
    ],
  };
}
