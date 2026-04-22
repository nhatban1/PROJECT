function toTimestamp(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function resolveRegistrationWindowStatus(semester, referenceTime = Date.now()) {
  if (!semester) {
    return { isOpen: false, message: 'Học kỳ không tồn tại' };
  }

  const registrationStart = toTimestamp(semester.registrationStart);
  const registrationEnd = toTimestamp(semester.registrationEnd);

  if (registrationStart !== null && referenceTime < registrationStart) {
    return { isOpen: false, message: 'Đợt đăng ký chưa mở' };
  }

  if (registrationEnd !== null && referenceTime > registrationEnd) {
    return { isOpen: false, message: 'Đợt đăng ký đã kết thúc' };
  }

  return { isOpen: true, message: '' };
}

function isSemesterRegistrationOpen(semester, referenceTime = Date.now()) {
  return resolveRegistrationWindowStatus(semester, referenceTime).isOpen;
}

module.exports = {
  resolveRegistrationWindowStatus,
  isSemesterRegistrationOpen,
};