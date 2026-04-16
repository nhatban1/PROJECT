requireAuth();

async function loadTeachers() {
  const result = await apiFetch("/teachers?page=1&limit=50");
  document.getElementById("teacherBody").innerHTML = result.data
    .map(teacher => `
      <tr>
        <td>${teacher.teacherId}</td>
        <td>${teacher.fullName}</td>
        <td>${teacher.department}</td>
        <td><button onclick="deleteTeacher('${teacher._id}')">Xóa</button></td>
      </tr>
    `).join("");
}

async function deleteTeacher(id) {
  if (!confirm("Xóa giảng viên này?")) return;
  await apiFetch(`/teachers/${id}`, { method: "DELETE" });
  loadTeachers();
}

document.getElementById("teacherForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const body = {
    teacherId: teacherId.value,
    fullName: fullName.value,
    department: department.value
  };
  await apiFetch("/teachers", { method: "POST", body: JSON.stringify(body) });
  event.target.reset();
  loadTeachers();
});

loadTeachers();