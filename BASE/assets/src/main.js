import { initThemeModule } from './themeToggle.js';
import { TableOfContents } from './tocGen.js';

document.addEventListener("DOMContentLoaded", () => {
  // Theme Toggle Functionality
  initThemeModule("darkModeToggler");
  // Table of Contents Generator
  const toc = new TableOfContents('#content', '#toc');
  toc.generate();
});