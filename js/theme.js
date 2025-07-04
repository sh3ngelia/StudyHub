document.addEventListener("DOMContentLoaded", () => {
  const themeToggleButtons = [
    document.getElementById("theme-toggle"),
    document.querySelector(".menu-overlay .theme-toggle")
  ].filter(Boolean);

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    const icon = isDark ? "☀️" : "🌙";

    themeToggleButtons.forEach(btn => {
      const iconSpan = btn.querySelector(".theme-icon");
      if (iconSpan) {
        iconSpan.textContent = icon;
      }
    });
  }

  function toggleTheme() {
    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }

  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    savedTheme = prefersDark ? "dark" : "light";
    localStorage.setItem("theme", savedTheme);
  }

  applyTheme(savedTheme);

  themeToggleButtons.forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });
});
