// md-to-html.js

import fs from "fs";
import path from "path";
import process from "process";
import readline from "readline";

// NEW: Use local marked and plugin
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
marked.use(gfmHeadingId()); // Enable plugin

// ==================== GLOBAL DEFAULTS ====================
const inputDirDefault = "notes";
const outputDirDefault = "public";
const useInlineCliDefault = "yes";
const superHeadingDefault = "My Project";
// =========================================================

/*
 * ----- Helper function for generating query -----
 * @params:
 *     query | String
 *     defaultValue | String
 */
function askQuestion(query, defaultValue) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(`${query} (${defaultValue}): `, (answer) => {
            rl.close();
            resolve(answer.trim() === "" ? defaultValue : answer.trim());
        });
    });
}

// ============================= Main function =============================
async function main() {
    let inputDir = process.argv[2]; // path to input directory
    let outputDir = process.argv[3]; // path to output directory
    let superHeading = process.argv[4]; // super heading for your notes
    let useInlineCli = process.argv[5]; // true or false for using inline css & js
    let assetsDirCli = process.argv[6]; // path to assets directory if not using inline

    console.log("\n--- Markdown to HTML Converter Setup ---");

    // ------------------------- QUERIES -------------------------
    // Queries it will ask if you don't pass command line arguments
    // If you pass, it will ask the remaining questions only. Amazing!
    if (!inputDir) {
        inputDir = await askQuestion(
            "Enter input directory for Markdown files",
            inputDirDefault
        );
    }

    if (!outputDir) {
        outputDir = await askQuestion(
            "Enter output directory for HTML files",
            outputDirDefault
        );
    }

    // Sets "useInline" variable from useInlineCli
    // which will be used in other places
    let useInline;
    if (useInlineCli === undefined) {
        const inlineChoice = await askQuestion(
            "Use inline CSS & JS (yes/no)?",
            useInlineCliDefault
        );
        useInline =
            inlineChoice.toLowerCase() === "yes" ||
            inlineChoice.toLowerCase() === "y";
    } else {
        useInline = useInlineCli.toLowerCase() === "true";
    }

    // It will ask for path to assets directory
    // only if you are not using inline css and js
    // We use assets dir for testing & extra functionalities
    let assetsDir = "";
    if (!useInline) {
        if (!assetsDirCli) {
            assetsDir = await askQuestion(
                "Enter path to assets directory (e.g., ./BASE/assets)",
                "./BASE/assets"
            );
        } else {
            assetsDir = assetsDirCli;
        }
    }

    if (!superHeading) {
        superHeading = await askQuestion(
            "Enter super heading for your pages",
            superHeadingDefault
        );
    }

    // Displays all the args value in CLI before proceeding
    console.log("\n--- Starting Conversion ---");
    console.log(`Input Directory: ${inputDir}`);
    console.log(`Output Directory: ${outputDir}`);
    console.log(`Use inline css and js: ${useInline}`);
    if (!useInline) console.log(`Assets Directory (local): ${assetsDir}`);
    console.log(`Super Heading: ${superHeading}`);
    console.log("---------------------------\n");

    // If useInline is:
    // - true: then paste the inline css & js
    // - false: then refer the assets directory for css & js
    let inlineCSS, inlineJS;
    if (useInline) {
        inlineCSS =
            '<style>body{font-family: Inter, sans-serif}img{max-width: 100%}code{font-family: "JetBrains Mono"}blockquote{background-color: var(--bs-secondary-bg-subtle);border-left: 5px solid var(--bs-secondary);padding: 1rem}blockquote p:last-child{margin-bottom: 0}table{--bs-table-color-type: initial;--bs-table-bg-type: initial;--bs-table-color-state: initial;--bs-table-bg-state: initial;--bs-table-color: var(--bs-emphasis-color);--bs-table-bg: var(--bs-body-bg);--bs-table-border-color: var(--bs-border-color);--bs-table-accent-bg: transparent;--bs-table-striped-color: var(--bs-emphasis-color);--bs-table-striped-bg: rgba(var(--bs-emphasis-color-rgb), 0.05);--bs-table-active-color: var(--bs-emphasis-color);--bs-table-active-bg: rgba(var(--bs-emphasis-color-rgb), 0.1);--bs-table-hover-color: var(--bs-emphasis-color);--bs-table-hover-bg: rgba(var(--bs-emphasis-color-rgb), 0.075);width: 100%;margin-bottom: 1rem;vertical-align: top;border-color: var(--bs-table-border-color)}table > :not(caption) > * > *{padding: 0.5rem 0.5rem;color: var(--bs-table-color-state, var(--bs-table-color-type, var(--bs-table-color)));background-color: var(--bs-table-bg);border-bottom-width: var(--bs-border-width);box-shadow: inset 0 0 0 9999px var(--bs-table-bg-state, var(--bs-table-bg-type, var(--bs-table-accent-bg)))}table > tbody{vertical-align: inherit}table > thead{vertical-align: bottom}.super-heading{background-color: var(--bs-primary-bg-subtle)}#content h1{font-weight: 900}#content h1,#content h2,#content h3{font-weight: 600;border-bottom: 1px solid var(--bs-border-color)}#content h1,#content h2,#content h3,#content h4,#content h5{padding: 1rem 0;margin-bottom: 1.5rem}#content img{border: 1px solid var(--bs-border-color)}#content p.youtube-video{position: relative}#content p.youtube-video:hover::after{content: "Youtube \\1F875";font-weight: bold;font-size: 1.5rem;display: flex;align-items: center;justify-content: center;position: absolute;inset: 0;background-color: hsla(0, 100%, 20%, 0.85);pointer-events: none}@media screen and (min-width: 992px){#toc{font-size: 14px;max-height: 600px;overflow: auto}}pre code.hljs{border-radius: var(--bs-border-radius);padding: 1rem}</style>';

        inlineJS =
            '<script>(()=>{let e=e=>{document.body.setAttribute("data-bs-theme",e?"dark":"light")};class t{constructor(e,t){this.container=document.querySelector(e),this.toc=document.querySelector(t)}generate(){if(!this.container||!this.toc)return void console.warn("TableOfContents: Container or TOC element not found.");let e=this.container.querySelectorAll("h1, h2, h3, h4, h5, h6"),t=document.createElement("ul");this.toc.appendChild(t);let n=1,o=t,r=[t];e.forEach(e=>{let t=parseInt(e.tagName.substring(1));e.id||(e.id=e.textContent.trim().toLowerCase().replace(/s+/g,"-").replace(/[^w-]/g,""));let d=document.createElement("li"),c=document.createElement("a");if(c.textContent=e.textContent,c.href=`#${e.id}`,d.appendChild(c),t>n){let e=document.createElement("ul");r[r.length-1].lastElementChild.appendChild(e),r.push(e),o=e}else if(t<n){for(let e=t;e<n;e++)r.pop();o=r[r.length-1]}o.appendChild(d),n=t})}}document.addEventListener("DOMContentLoaded",()=>{(t=>{if(!t)return console.error("Theme toggler ID must be provided to initThemeModule(togglerId)");let n=document.getElementById(t);if(!n)return console.error(`Element with ID "${t}" not found`);let o=window.matchMedia("(prefers-color-scheme: dark)").matches;n.checked=o,document.body.setAttribute("data-bs-theme",o?"dark":"light"),n.addEventListener("change",t=>{e(t.target.checked)}),(t=>{document.addEventListener("keydown",n=>{n.shiftKey&&"D"===n.key&&(t.checked=!t.checked,e(t.checked))})})(n)})("darkModeToggler"),new t("#content","#toc").generate()})})();</script>';
    } else {
        if (
            !assetsDir ||
            !fs.existsSync(assetsDir) ||
            !fs.lstatSync(assetsDir).isDirectory()
        ) {
            console.error(
                `Error: Local assets directory '${assetsDir}' not found or is not a directory.`
            );
            process.exit(1);
        } else {
            inlineCSS = `<link rel="stylesheet" href="${path.join(
                assetsDir,
                "css/style.css"
            )}" />`;
            inlineJS = `<script src="${path.join(
                assetsDir,
                "js/main.js"
            )}"></script>`;
        }
    }

    const HTML_START = (title, superHeading, css) => `<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
  ${css}
</head>
<body>
  <header class="d-flex justify-content-center">
    <a href="index.html" class="super-heading text-decoration-none d-inline-block fw-bold shadow-sm border border-primary border-top-0 py-2 px-4">${superHeading}</a>
  </header>
  <main id="main-content" class="py-5">
    <div class="container">
      <div class="row">
        <div class="col-lg-4 order-lg-2">
          <div class="card shadow-sm mb-3 sticky-top">
            <div class="card-header d-flex align-items-center justify-content-between">
              <span class="fw-bold">Table of Contents</span>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="darkModeToggler">
                <label class="form-check-label" for="darkModeToggler">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon-star">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                  </svg>
                </label>
              </div>
            </div>
            <div id="toc" class="card-body"></div>
          </div>
        </div>
        <div class="col-lg-8 order-lg-1">
          <div class="card shadow-sm">
            <div id="content" class="card-body p-lg-4">
`;

    const HTML_END = (js) => `
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="position-fixed bottom-0 start-50 translate-middle">
    <a href="#" class="btn btn-primary btn-sm shadow-lg">&uarr;</a>
  </footer>

  ${js}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/bash.min.js" integrity="sha512-nQ9BQEzuov+Ry6EIH8ve7VKKdOG91Ix3SAQcFmOiBR5qG8sJONrph1InWTJOGjfP5QkSTSy4VnkEsPMoFYRsUQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/css.min.js" integrity="sha512-fQhadp2Av4sRhTYd9TEggQW4NrosThwDUXIMLin90uepvmCZG0mRTdPVtHujrXD22qMTtdQlrAEdvWocezI8ow==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/javascript.min.js" integrity="sha512-yfJUrNGEC39mHLjZ37CZG69Ij9Vnan7NHxXVuuBxafgfk4F+n7j/NhNWtyhKGTYEgWfgUqzPYMZJZY1HIsPCbQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/typescript.min.js" integrity="sha512-boNfTX+JS3EKGz5StKSBao0E9B3W3/4UR6M8dUKy1SLIdiQ4SpXoBtD9IffOkut6N4quRr4uUWf8K4qXPu2YAA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/java.min.js" integrity="sha512-DTx6faal3nhEB55v+yn8UnXCxaxCdMR6gBZ0zzXhGD2qvtgf6xbW5iA7G4CUn78R9PoPzTelR7xIQwGNUJAv2w==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;

    // -------------------- Neccessary Validations --------------------
    // check if input directory exists or if it is a directory
    // if not present, stop the process.
    if (!fs.existsSync(inputDir) || !fs.lstatSync(inputDir).isDirectory()) {
        console.error(`Error: Directory '${inputDir}' does not exist.`);
        process.exit(1);
    }

    // checks if output directory exists, if not create one
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    // ----- Images Folder -----
    // if output directory is different than input directory
    // then also copy the imgs/ folder to the output directory.
    if (outputDir !== inputDir) {
        const imgSrc = path.join(inputDir, "imgs");
        const imgDest = path.join(outputDir, "imgs");
        if (fs.existsSync(imgSrc)) {
            fs.cpSync(imgSrc, imgDest, { recursive: true });
            console.log(`Copied 'imgs' folder to: ${imgDest}`);
        } else {
            console.log("No 'imgs' folder found in input directory.");
        }
    }

    // indexLinks array: stores the links to all the files
    // that have been converted from the input directory, which
    // will be used for listing on the index.html page
    const indexLinks = [];

    // --------------------------- MD->HTML ---------------------------
    // When everything is ok. Now convert all the markdown files
    // in the input directory to output directory.
    // Also add the links of converted files into `indexLinks`
    fs.readdirSync(inputDir).forEach((file) => {
        if (file.endsWith(".md")) {
            const filePath = path.join(inputDir, file);
            const baseName = path.basename(file, ".md");
            const outputFile = path.join(outputDir, `${baseName}.html`);

            // rawContent = markdown Content
            const rawContent = fs.readFileSync(filePath, "utf8");
            const titleMatch = rawContent.match(/^#\s+(.+)/m);
            const title = titleMatch ? titleMatch[1].trim() : baseName;

            const htmlContent = marked.parse(rawContent);

            const finalHTML = `${HTML_START(
                title,
                superHeading,
                inlineCSS
            )}${htmlContent}${HTML_END(inlineJS)}`;
            fs.writeFileSync(outputFile, finalHTML, "utf8");

            console.log(`Converted ${file} -> ${outputFile}`);
            indexLinks.push(
                `<li class="list-group-item"><a href="./${baseName}.html" class="text-decoration-none">${title}</a></li>`
            );
        }
    });

    // finally generating index.html page using the indexLinks array
    // containing the links to all the pages converted.
    const indexHTML = `${HTML_START(superHeading, superHeading, inlineCSS)}
                        ${marked(`# ${superHeading}`)}
                        <ul class="list-group list-group-flush">
                            ${indexLinks.join("\n")}
                        </ul>
                        ${HTML_END(inlineJS)}`;

    fs.writeFileSync(path.join(outputDir, "index.html"), indexHTML, "utf8");
    console.log(`Generated index.html in ${outputDir}`);
}

main();
