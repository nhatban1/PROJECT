requireAuth();

async function loadRegistrations() {
  const result = await apiFetch("/registrations/my");
  document.getElementById("registrationBody").innerHTML = result.data
    .map(r => `
      <tr>
        <td>${r.courseId.courseId}</td>
        <td>${r.semesterId.semesterId}</td>
        <td>${r.status}</td>
      </tr>
    `).join("");
}

document.getElementById("registrationForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const body = {
    courseId: courseId.value,
    semesterId: semesterId.value
  };
  await apiFetch("/registrations", { method: "POST", body: JSON.stringify(body) });
  loadRegistrations();
});

loadRegistrations();