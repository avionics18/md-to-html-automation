export class TableOfContents {
  constructor(containerSelector, tocSelector) {
    this.container = document.querySelector(containerSelector);
    this.toc = document.querySelector(tocSelector);
  }

  generate() {
    if (!this.container || !this.toc) {
      console.warn('TableOfContents: Container or TOC element not found.');
      return;
    }

    const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6');

    let tocList = document.createElement('ul');
    this.toc.appendChild(tocList);
    let lastLevel = 1;
    let currentList = tocList;
    const stack = [tocList];

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));

      // Assign id if not present
      if (!heading.id) {
        heading.id = heading.textContent.trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]/g, '');
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = heading.textContent;
      a.href = `#${heading.id}`;
      li.appendChild(a);

      if (level > lastLevel) {
        const newList = document.createElement('ul');
        stack[stack.length - 1].lastElementChild.appendChild(newList);
        stack.push(newList);
        currentList = newList;
      } else if (level < lastLevel) {
        for (let i = level; i < lastLevel; i++) {
          stack.pop();
        }
        currentList = stack[stack.length - 1];
      }

      currentList.appendChild(li);
      lastLevel = level;
    });
  }
}
