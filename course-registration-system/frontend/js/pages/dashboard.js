requireAuth();

async function loadStats() {
  const result = await apiFetch("/dashboard");
  const { studentCount, teacherCount, courseCount, registrationCount } = result.data;
  document.getElementById("studentCount").textContent = studentCount;
  document.getElementById("teacherCount").textContent = teacherCount;
  document.getElementById("courseCount").textContent = courseCount;
  document.getElementById("registrationCount").textContent = registrationCount;
}

document.getElementById("logoutBtn").addEventListener("click", logout);
loadStats();