function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/pages/login.html";
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "/pages/login.html";
  }
}