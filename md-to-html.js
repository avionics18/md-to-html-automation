// md-to-html.js

const fs = require('fs');
const path = require('path');
const process = require('process');
const { execSync } = require('child_process');
const readline = require('readline'); // Import the readline module

// Helper function for prompting
function askQuestion(query, defaultValue) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(`${query} (${defaultValue}) `, answer => {
            rl.close();
            resolve(answer.trim() === '' ? defaultValue : answer.trim());
        });
    });
}

// ----------- Main Script -----------

async function main() {
    let inputDir = process.argv[2];
    let outputDir = process.argv[3];
    let useCdnCli = process.argv[4]; // New argument for CDN choice (true/false)
    let assetsDirCli = process.argv[5]; // Shifted argument
    let superHeading = process.argv[6]; // Shifted argument

    console.log("\n--- Markdown to HTML Converter Setup ---");

    if (!inputDir) {
        inputDir = await askQuestion('Enter input directory for Markdown files', '.');
    }
    inputDir = inputDir || '.'; // Ensure default if user just presses enter

    if (!outputDir) {
        outputDir = await askQuestion(`Enter output directory for HTML files`, inputDir);
    }
    outputDir = outputDir || inputDir; // Ensure default if user just presses enter

    let useCdn;
    if (useCdnCli === undefined) { // If not provided via CLI
        const cdnChoice = await askQuestion('Use CDN for custom CSS/JS (yes/no)?', 'yes');
        useCdn = cdnChoice.toLowerCase() === 'yes' || cdnChoice.toLowerCase() === 'y';
    } else {
        useCdn = useCdnCli.toLowerCase() === 'true';
    }

    let assetsDir = '';
    if (!useCdn) { // Only ask for assets path if not using CDN
        if (!assetsDirCli) {
            assetsDir = await askQuestion('Enter path to assets directory (e.g., ./BASE/assets)', './BASE/assets');
        } else {
            assetsDir = assetsDirCli;
        }
    }
    // No default for assetsDir if not provided and not using CDN, as it's required in that case.
    // If assetsDir is still empty here and useCdn is false, it means the user didn't provide it
    // and it was prompted but they left it blank. We should ideally validate this later.

    if (!superHeading) {
        superHeading = await askQuestion('Enter super heading for your pages', 'Notes');
    }
    superHeading = superHeading || 'Notes'; // Ensure default if user just presses enter

    console.log("\n--- Starting Conversion ---");
    console.log(`Input Directory: ${inputDir}`);
    console.log(`Output Directory: ${outputDir}`);
    console.log(`Use Custom CDN for style.css/main.js: ${useCdn}`);
    if (!useCdn) {
        console.log(`Assets Directory (local): ${assetsDir || 'Not specified'}`); // Display if not using CDN
    }
    console.log(`Super Heading: ${superHeading}`);
    console.log("---------------------------\n");

    // Pre-calculate CSS and JS links based on CDN choice
    let cssLink;
    let jsMainScript;

    if (useCdn) {
        // IMPORTANT: Replace 'yourUser/my-assets' with your actual GitHub username and repository name
        // And ensure the branch is correct (e.g., 'main' or 'master')
        const cdnBase = "https://cdn.jsdelivr.net/gh/yourUser/my-assets@main";
        cssLink = `<link rel="stylesheet" href="${cdnBase}/css/style.css" />`;
        jsMainScript = `<script type="module" src="${cdnBase}/js/main.js"></script>`;
    } else {
        cssLink = `<link rel="stylesheet" href="./assets/css/style.css" />`;
        jsMainScript = `<script type="module" src="./assets/js/main.js"></script>`;

        // Validate assetsDir if local assets are chosen
        if (!assetsDir || (!fs.existsSync(assetsDir) || !fs.lstatSync(assetsDir).isDirectory())) {
            console.error(`Error: Local assets directory '${assetsDir}' not found or is not a directory. Please provide a valid path or choose to use CDN.`);
            process.exit(1);
        }
    }


    // HTML_START and HTML_END are now functions that take the pre-calculated links
    // Highlight.js CDN links are now back as static parts of HTML_END
    const HTML_START = (title, superHeading, cssLink) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css" integrity="sha512-rO+olRTkcf304DQBxSWxln8JXCzTHlKnIdnMUwYvQa9/Jd4cQaNkItIUj6Z4nvW1dqK0SKXLbn9h4KwZTNtAyw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  ${cssLink}
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

    const HTML_END = (jsMainScript) => `
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  ${jsMainScript}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" integrity="sha512-EBLzUL8XLl+va/zAsmXwS7Z2B1F9HUHkZwyS/VKwh3S7T/U0nF4BaU29EP/ZSf6zgiIxYAnKLu6bJ8dqpmX5uw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/bash.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/html.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/css.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/java.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;


    // Directory existence checks and asset copying
    if (!fs.existsSync(inputDir) || !fs.lstatSync(inputDir).isDirectory()) {
        console.error(`Error: Directory '${inputDir}' does not exist.`);
        process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    // Copy assets folder only if NOT using CDN
    if (!useCdn) {
        const assetsSrc = path.resolve(assetsDir); // Resolve to an absolute path
        const assetsDest = path.join(outputDir, 'assets');
        if (fs.existsSync(assetsSrc) && fs.lstatSync(assetsSrc).isDirectory()) {
            fs.cpSync(assetsSrc, assetsDest, { recursive: true });
            console.log(`Copied assets from '${assetsSrc}' to: ${assetsDest}`);
        } else {
            // This error should already be caught by the earlier validation, but good to have a fallback.
            console.error(`Error: Local assets directory '${assetsSrc}' not found or is not a directory. Cannot proceed without assets if CDN is not used.`);
            process.exit(1);
        }
    }

    // Copy imgs folder if applicable (existing logic, still relevant regardless of CDN)
    if (outputDir !== inputDir) {
        const imgSrc = path.join(inputDir, 'imgs');
        const imgDest = path.join(outputDir, 'imgs');
        if (fs.existsSync(imgSrc)) {
            fs.cpSync(imgSrc, imgDest, { recursive: true });
            console.log(`Copied 'imgs' folder to: ${imgDest}`);
        } else {
            console.log("No 'imgs' folder found in input directory.");
        }
    }

    const indexLinks = [];

    fs.readdirSync(inputDir).forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(inputDir, file);
            const baseName = path.basename(file, '.md');
            const tempFile = path.join(outputDir, `${baseName}_temp.html`);
            const outputFile = path.join(outputDir, `${baseName}.html`);

            const rawContent = fs.readFileSync(filePath, 'utf8');
            const titleMatch = rawContent.match(/^#\s+(.+)/m);
            const title = titleMatch ? titleMatch[1].trim() : baseName;

            try {
                execSync(`marked -o "${tempFile}" "${filePath}"`);
            } catch (err) {
                console.error(`Failed to convert ${filePath} with marked. Error: ${err.message}`);
                return;
            }

            const htmlContent = fs.readFileSync(tempFile, 'utf8');
            fs.unlinkSync(tempFile);

            // Pass the determined links to the HTML parts
            const finalHTML = `${HTML_START(title, superHeading, cssLink)}${htmlContent}${HTML_END(jsMainScript)}`;
            fs.writeFileSync(outputFile, finalHTML, 'utf8');

            console.log(`Converted ${file} -> ${outputFile}`);
            indexLinks.push(`<li class="list-group-item">
                      <a href="./${baseName}.html" class="text-decoration-none">${title}</a>
                    </li>`);
        }
    });

    // Generate index.html
    const indexHTML = `${HTML_START(superHeading, superHeading, cssLink)}
                  <h1 class="mb-4">${superHeading}</h1>
                  <ul class="list-group list-group-flush">
                    ${indexLinks.join('\n')}
                  </ul>
                  ${HTML_END(jsMainScript)}`;

    fs.writeFileSync(path.join(outputDir, 'index.html'), indexHTML, 'utf8');
    console.log(`Generated index.html in ${outputDir}`);
}

main(); // Call the async main function

/* =================== USAGE ===================

Case 1: Run interactively (will prompt for all values, using defaults if left blank)
>>> node md-to-html.js

Case 2: Provide some arguments via CLI, others will be prompted
>>> node md-to-html.js ./markdowns ./output_html

Case 3: Provide all arguments via CLI (no prompts will appear)
    - To use CDN for custom CSS/JS:
    >>> node md-to-html.js ./markdowns ./output_html true "My Markdown Blog Posts"
    - To use local assets for custom CSS/JS:
    >>> node md-to-html.js ./markdowns ./output_html false ./BASE/assets "My Markdown Blog Posts"

============================================= */