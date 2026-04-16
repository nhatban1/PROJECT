module.exports = {
  overlapSchedule(a, b) {
    if (!a || !b) return false;
    if (a.dayOfWeek !== b.dayOfWeek) return false;
    return a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod;
  }
};