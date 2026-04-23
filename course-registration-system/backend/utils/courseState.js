const THEORY_PRICE_PER_CREDIT = 750000;
const PRACTICE_PRICE_PER_CREDIT = 800000;

function toInteger(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function calculateCoursePrice(course) {
  const totalCredits = toInteger(course?.credits);
  const hasTheoryCredits = course?.theoryCredits !== undefined && course?.theoryCredits !== null;
  const hasPracticeCredits = course?.practiceCredits !== undefined && course?.practiceCredits !== null;

  if (hasTheoryCredits || hasPracticeCredits) {
    const practiceCredits = hasPracticeCredits ? toInteger(course.practiceCredits) : Math.max(totalCredits - toInteger(course?.theoryCredits), 0);
    const theoryCredits = hasTheoryCredits ? toInteger(course.theoryCredits) : Math.max(totalCredits - practiceCredits, 0);

    return Math.max(theoryCredits, 0) * THEORY_PRICE_PER_CREDIT + Math.max(practiceCredits, 0) * PRACTICE_PRICE_PER_CREDIT;
  }

  return totalCredits * THEORY_PRICE_PER_CREDIT;
}

function resolveCourseStatus(course, requestedStatus) {
  if (requestedStatus === 'planned') {
    return 'planned';
  }

  if (requestedStatus === 'closed') {
    return 'closed';
  }

  if (requestedStatus === 'ongoing') {
    return 'ongoing';
  }

  if (requestedStatus === 'full') {
    return 'full';
  }

  if (requestedStatus === 'open') {
    return course.currentStudents >= course.maxStudents ? 'full' : 'open';
  }

  if (course.status === 'ongoing' || course.status === 'closed' || course.status === 'planned') {
    return course.status;
  }

  return course.currentStudents >= course.maxStudents ? 'full' : 'open';
}

function applyCourseStatus(course, nextStatus, now = new Date()) {
  const previousStatus = course.status;
  course.status = nextStatus;

  if (nextStatus === 'open') {
    if (previousStatus !== 'open' || !course.openedAt) {
      course.openedAt = now;
    }
  }

  if (nextStatus === 'full') {
    if (previousStatus !== 'full' || !course.fullAt) {
      course.fullAt = now;
    }
  } else {
    course.fullAt = undefined;
  }

  return course.status;
}

function syncCourseQualification(course, minimumStudents, now = new Date()) {
  if (!course || typeof minimumStudents !== 'number' || Number.isNaN(minimumStudents) || minimumStudents < 1) {
    return course?.qualifiedAt;
  }

  if (course.currentStudents >= minimumStudents) {
    if (!course.qualifiedAt) {
      course.qualifiedAt = now;
    }
  } else {
    course.qualifiedAt = undefined;
  }

  return course.qualifiedAt;
}

module.exports = {
  THEORY_PRICE_PER_CREDIT,
  PRACTICE_PRICE_PER_CREDIT,
  calculateCoursePrice,
  resolveCourseStatus,
  applyCourseStatus,
  syncCourseQualification,
};