function calculateEndTime(
  date: string,
  startTime: string,
  durationMin: number
) {
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMin * 60000);

  const hh = String(end.getHours()).padStart(2, "0");
  const mm = String(end.getMinutes()).padStart(2, "0");

  return {
    endTime: `${hh}:${mm}`,
    endISO: end.toISOString(),
  };
}

function hasOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}
