requireAuth();

async function loadStudents() {
  const result = await apiFetch("/users?page=1&limit=50");
  document.getElementById("studentBody").innerHTML = result.data
    .filter(user => user.role === "student")
    .map(user => `
      <tr>
        <td>${user.email}</td>
        <td>${user.fullName}</td>
        <td>${user.role}</td>
      </tr>
    `).join("");
}

loadStudents();