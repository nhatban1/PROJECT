// theme toggle utility
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function isSystemDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSavedTheme() {
  try {
    return localStorage.getItem('theme');
  } catch (e) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {}
}

function toggleTheme() {
  const current = getSavedTheme() || (isSystemDark() ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
  return next;
}

function initTheme() {
  const saved = getSavedTheme();
  const theme = saved || (isSystemDark() ? 'dark' : 'light');
  applyTheme(theme);
  // attach toggle button if present
  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', () => {
    const next = toggleTheme();
    btn.setAttribute('data-theme', next);
  });
}

if (typeof window !== 'undefined') {
  window.toggleTheme = toggleTheme;
  window.initTheme = initTheme;
  window.isDarkTheme = () => (document.documentElement.classList.contains('dark'));
  document.addEventListener('DOMContentLoaded', initTheme);
}
