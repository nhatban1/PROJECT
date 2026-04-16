requireAuth();

async function loadSchedule() {
  const result = await apiFetch("/registrations/my");
  document.getElementById("scheduleBody").innerHTML = result.data
    .map(reg => `
      <tr>
        <td>${reg.courseId.name || reg.courseId.courseId}</td>
        <td>${reg.semesterId.semesterId}</td>
        <td>${reg.courseId.schedule?.dayOfWeek || "N/A"}</td>
        <td>${reg.courseId.schedule ? `${reg.courseId.schedule.startPeriod}-${reg.courseId.schedule.endPeriod}` : "N/A"}</td>
        <td>${reg.courseId.schedule?.room || "N/A"}</td>
      </tr>
    `).join("");
}

loadSchedule();