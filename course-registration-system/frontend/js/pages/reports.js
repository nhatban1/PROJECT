requireAuth();

async function loadReports() {
  const result = await apiFetch("/dashboard");
  const data = result.data;
  document.getElementById("reportPanel").innerHTML = `
    <p><strong>Sinh viên:</strong> ${data.studentCount}</p>
    <p><strong>Giảng viên:</strong> ${data.teacherCount}</p>
    <p><strong>Môn học:</strong> ${data.courseCount}</p>
    <p><strong>Đăng ký đang hiệu lực:</strong> ${data.registrationCount}</p>
  `;
}

loadReports();