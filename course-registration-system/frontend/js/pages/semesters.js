requireAuth();

async function loadSemesters() {
  const result = await apiFetch("/semesters?page=1&limit=50");
  document.getElementById("semesterBody").innerHTML = result.data
    .map(semester => `
      <tr>
        <td>${semester.semesterId}</td>
        <td>${semester.name}</td>
        <td>${semester.status}</td>
        <td>${new Date(semester.registrationStart).toLocaleDateString()} - ${new Date(semester.registrationEnd).toLocaleDateString()}</td>
      </tr>
    `).join("");
}

document.getElementById("semesterForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const body = {
    semesterId: semesterId.value,
    name: name.value,
    startDate: startDate.value,
    endDate: endDate.value,
    registrationStart: registrationStart.value,
    registrationEnd: registrationEnd.value,
    maxCredits: Number(maxCredits.value)
  };
  await apiFetch("/semesters", { method: "POST", body: JSON.stringify(body) });
  event.target.reset();
  loadSemesters();
});

loadSemesters();