import dayjs from 'dayjs';

export function startOfDay(d) {
  return dayjs(d).startOf('day').toDate();
}

export function parseTimeOnDate(date, hhmm) {
  const [h, m] = String(hhmm || '08:00').split(':').map(Number);
  return dayjs(date).hour(h).minute(m || 0).second(0).millisecond(0).toDate();
}

export function recomputeAttendanceMetrics(record, rules) {
  const requiredMinutes = Math.round((rules.requiredHoursPerDay || 8) * 60);
  const grace = rules.graceMinutes || 0;
  const shiftStart = parseTimeOnDate(record.date, rules.shiftStart || '08:00');

  let workedMinutes = 0;
  let lateMinutes = 0;
  let overtimeMinutes = 0;
  let shortfallMinutes = 0;

  if (record.checkIn && record.checkOut) {
    workedMinutes = Math.max(0, Math.round((record.checkOut - record.checkIn) / 60000));
    const lateRaw = Math.round((record.checkIn - shiftStart) / 60000);
    lateMinutes = Math.max(0, lateRaw - grace);

    if (workedMinutes > requiredMinutes) {
      overtimeMinutes = workedMinutes - requiredMinutes;
      shortfallMinutes = 0;
    } else if (workedMinutes < requiredMinutes) {
      shortfallMinutes = requiredMinutes - workedMinutes;
      overtimeMinutes = 0;
    }
  }

  return { workedMinutes, lateMinutes, overtimeMinutes, shortfallMinutes };
}

export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${h}:${mm}`;
}

export function roundKwd(n) {
  return Math.round((Number(n) || 0) * 1000) / 1000;
}
