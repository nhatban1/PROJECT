document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    saveToken(result.data.token);
    window.location.href = "/pages/dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});