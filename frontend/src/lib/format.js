import dayjs from 'dayjs';

export function formatKwd(value) {
  const n = Number(value) || 0;
  return `${new Intl.NumberFormat('en-KW', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n)} KWD`;
}

export function formatDate(value) {
  if (!value) return '-';
  return dayjs(value).format('DD/MM/YYYY');
}

export function formatDateTime(value) {
  if (!value) return '-';
  return dayjs(value).format('DD/MM/YYYY HH:mm');
}

export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${h}:${mm}`;
}

export function formatTime(value) {
  if (!value) return '-';
  return dayjs(value).format('HH:mm');
}

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function monthLabel(month, year) {
  const m = MONTHS.find((x) => x.value === month);
  return `${m?.label || month} ${year}`;
}
