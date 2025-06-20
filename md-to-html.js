// md-to-html.js

const fs = require('fs');
const path = require('path');
const process = require('process');
const { execSync } = require('child_process');
const readline = require('readline');

// Helper function for generating query
// @params:
//     query | String
//     defaultValue | String
function askQuestion(query, defaultValue) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${query} (${defaultValue}): `, answer => {
      rl.close();
      resolve(answer.trim() === '' ? defaultValue : answer.trim());
    });
  });
}

// ------------------------ Main function ------------------------
async function main() {
  let inputDir = process.argv[2]; // path to input directory
  let outputDir = process.argv[3]; // path to output directory
  let useCdnCli = process.argv[4]; // yes or no for using cdn
  let assetsDirCli = process.argv[5]; // path to assets directory if not using cdn
  let superHeading = process.argv[6]; // super heading for your notes

  console.log("\n--- Markdown to HTML Converter Setup ---");

  // Queries it will ask if you don't pass command line arguments
  // If you pass, it will ask the remaining questions only. Amazing!
  if (!inputDir) inputDir = await askQuestion('Enter input directory for Markdown files', '.');
  if (!outputDir) outputDir = await askQuestion('Enter output directory for HTML files', inputDir);

  let useCdn;
  if (useCdnCli === undefined) {
    const cdnChoice = await askQuestion('Use CDN for custom CSS/JS (yes/no)?', 'yes');
    useCdn = cdnChoice.toLowerCase() === 'yes' || cdnChoice.toLowerCase() === 'y';
  } else {
    useCdn = useCdnCli.toLowerCase() === 'true';
  }

  // it will ask for path to assets directory only if
  // you are not using cdn links
  let assetsDir = '';
  if (!useCdn) {
    if (!assetsDirCli) {
      assetsDir = await askQuestion('Enter path to assets directory (e.g., ./BASE/assets)', './BASE/assets');
    } else {
      assetsDir = assetsDirCli;
    }
  }

  if (!superHeading) superHeading = await askQuestion('Enter super heading for your pages', 'Notes');

  console.log("\n--- Starting Conversion ---");
  console.log(`Input Directory: ${inputDir}`);
  console.log(`Output Directory: ${outputDir}`);
  console.log(`Use Custom CDN for style.css/main.js: ${useCdn}`);
  if (!useCdn) console.log(`Assets Directory (local): ${assetsDir}`);
  console.log(`Super Heading: ${superHeading}`);
  console.log("---------------------------\n");

  let cssLink, jsMainScript;

  if (useCdn) {
    const cdnBase = "https://cdn.jsdelivr.net/gh/avionics18/md-to-html-automation@v1.0.1";
    cssLink = `<link rel="stylesheet" href="${cdnBase}/BASE/assets/css/style.min.css" />`;
    jsMainScript = `<script async="true" crossorigin="anonymous" src="${cdnBase}/BASE/assets/js/main.min.js"></script>`;
  } else {
    cssLink = `<link rel="stylesheet" href="./assets/css/style.css" />`;
    jsMainScript = `<script src="./assets/js/main.js"></script>`;

    if (!assetsDir || (!fs.existsSync(assetsDir) || !fs.lstatSync(assetsDir).isDirectory())) {
      console.error(`Error: Local assets directory '${assetsDir}' not found or is not a directory.`);
      process.exit(1);
    }
  }

  const HTML_START = (title, superHeading, cssLink) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/bash.min.js" integrity="sha512-nQ9BQEzuov+Ry6EIH8ve7VKKdOG91Ix3SAQcFmOiBR5qG8sJONrph1InWTJOGjfP5QkSTSy4VnkEsPMoFYRsUQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/css.min.js" integrity="sha512-fQhadp2Av4sRhTYd9TEggQW4NrosThwDUXIMLin90uepvmCZG0mRTdPVtHujrXD22qMTtdQlrAEdvWocezI8ow==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/javascript.min.js" integrity="sha512-yfJUrNGEC39mHLjZ37CZG69Ij9Vnan7NHxXVuuBxafgfk4F+n7j/NhNWtyhKGTYEgWfgUqzPYMZJZY1HIsPCbQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/typescript.min.js" integrity="sha512-boNfTX+JS3EKGz5StKSBao0E9B3W3/4UR6M8dUKy1SLIdiQ4SpXoBtD9IffOkut6N4quRr4uUWf8K4qXPu2YAA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/java.min.js" integrity="sha512-DTx6faal3nhEB55v+yn8UnXCxaxCdMR6gBZ0zzXhGD2qvtgf6xbW5iA7G4CUn78R9PoPzTelR7xIQwGNUJAv2w==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;

  // checks if input directory exists or if it is a directory
  // if not stops the process then an there. But that will not
  // happen, as default argument is "." current folder
  if (!fs.existsSync(inputDir) || !fs.lstatSync(inputDir).isDirectory()) {
    console.error(`Error: Directory '${inputDir}' does not exist.`);
    process.exit(1);
  }

  // checks if output directory exists, if not create one
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  // if not using cdn, then copy the css/ and js/ folder form
  // assets directory to the output directory.
  if (!useCdn) {
    const cssSrc = path.join(assetsDir, 'css');
    const jsSrc = path.join(assetsDir, 'js');
    const cssDest = path.join(outputDir, 'assets/css');
    const jsDest = path.join(outputDir, 'assets/js');

    // copy the css files only if css directory
    // exists in the assets directory
    if (fs.existsSync(cssSrc)) {
      fs.mkdirSync(path.dirname(cssDest), { recursive: true });
      fs.cpSync(cssSrc, cssDest, { recursive: true });
    }
    // copy the js files only if js directory
    // exists in the assets directory
    if (fs.existsSync(jsSrc)) {
      fs.mkdirSync(path.dirname(jsDest), { recursive: true });
      fs.cpSync(jsSrc, jsDest, { recursive: true });
    }

    console.log(`Copied 'css' and 'js' folders to: ${path.join(outputDir, 'assets')}`);
  }

  // if output directory is different than input directory
  // then also copy the imgs/ folder to the output directory.
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

  // indexLinks array for storing the links to all the files
  // that have been converted in the input directory, which
  // will be used for index.html page
  const indexLinks = [];

  // Main Task:
  // When everything is ok. Now convert all the markdown files
  // in the input directory to output directory.
  // Also add the links to converted files into indexLinks
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

      const finalHTML = `${HTML_START(title, superHeading, cssLink)}${htmlContent}${HTML_END(jsMainScript)}`;
      fs.writeFileSync(outputFile, finalHTML, 'utf8');

      console.log(`Converted ${file} -> ${outputFile}`);
      indexLinks.push(`<li class="list-group-item"><a href="./${baseName}.html" class="text-decoration-none">${title}</a></li>`);
    }
  });

  // finally generating index.html page using the indexLinks array
  // containing the links to all the pages converted.
  const indexHTML = `${HTML_START(superHeading, superHeading, cssLink)}
  <h1 class="mb-4">${superHeading}</h1>
  <ul class="list-group list-group-flush">
    ${indexLinks.join('\n')}
  </ul>
  ${HTML_END(jsMainScript)}`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHTML, 'utf8');
  console.log(`Generated index.html in ${outputDir}`);
}

main();
