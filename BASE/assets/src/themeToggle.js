const toggleTheme = (isChecked) => {
  const theme = isChecked ? "dark" : "light";
  document.body.setAttribute("data-bs-theme", theme);
};

const handleThemeToggle = (themeStitcher) => {
  themeStitcher.addEventListener("change", (e) => {
    toggleTheme(e.target.checked);
  });
};

const handleKeyboardToggle = (themeStitcher) => {
  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key === "D") {
      themeStitcher.checked = !themeStitcher.checked;
      toggleTheme(themeStitcher.checked);
    }
  });
};

export const initThemeModule = (togglerId) => {
  if (!togglerId) {
    console.error("Theme toggler ID must be provided to initThemeModule(togglerId)");
    return;
  }

  const themeStitcher = document.getElementById(togglerId);
  if (!themeStitcher) {
    console.error(`Element with ID "${togglerId}" not found`);
    return;
  }

  const isSystemThemeSetToDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  themeStitcher.checked = isSystemThemeSetToDark;
  document.body.setAttribute("data-bs-theme", isSystemThemeSetToDark ? "dark" : "light");

  handleThemeToggle(themeStitcher);
  handleKeyboardToggle(themeStitcher);
};
