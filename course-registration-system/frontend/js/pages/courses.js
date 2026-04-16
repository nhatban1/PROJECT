requireAuth();

async function loadCourses() {
  try {
    const result = await apiFetch("/courses?page=1&limit=30");
    const rows = result.data.map(course => `
      <tr>
        <td>${course.courseId}</td>
        <td>${course.name}</td>
        <td>${course.credits}</td>
        <td><button onclick="deleteCourse('${course._id}')">Xóa</button></td>
      </tr>
    `);
    document.getElementById("courseBody").innerHTML = rows.join("");
  } catch (error) {
    alert(error.message);
    if (error.message.includes("Unauthorized")) logout();
  }
}

async function deleteCourse(id) {
  if (!confirm("Bạn có muốn xóa môn này không?")) return;
  await apiFetch(`/courses/${id}`, { method: "DELETE" });
  loadCourses();
}

document.getElementById("courseForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const body = {
    courseId: courseId.value,
    name: courseName.value,
    credits: Number(credits.value),
    teacherId: teacherId.value,
    semesterId: semesterId.value,
    schedule: { dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: "A101" },
    maxStudents: 40
  };
  await apiFetch("/courses", { method: "POST", body: JSON.stringify(body) });
  event.target.reset();
  loadCourses();
});

loadCourses();