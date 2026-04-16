requireAuth();

async function searchCourses(event) {
  event?.preventDefault();
  const term = searchTerm.value.trim().toLowerCase();
  const result = await apiFetch("/courses?page=1&limit=100");
  const filtered = result.data.filter(course =>
    course.name.toLowerCase().includes(term) || course.courseId.toLowerCase().includes(term)
  );
  document.getElementById("searchBody").innerHTML = filtered
    .map(course => `
      <tr>
        <td>${course.courseId}</td>
        <td>${course.name}</td>
        <td>${course.credits}</td>
        <td>${course.teacherId?.fullName || "N/A"}</td>
      </tr>
    `).join("");
}

document.getElementById("searchForm").addEventListener("submit", searchCourses);
loadSearch();

async function loadSearch() {
  await searchCourses();
}