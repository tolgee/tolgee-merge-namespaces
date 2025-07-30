#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    i18nDir: 'i18n',
    help: false,
    version: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--dir' || arg === '-d') {
      if (i + 1 < args.length) {
        options.i18nDir = args[i + 1];
        i++; // Skip the next argument
      }
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
tolgee-merge-namespaces

A tool to merge translations across namespaces in Tolgee i18n files.

Usage:
  tolgee-merge-namespaces [options]

Options:
  --dir, -d <path>   Specify the i18n directory (default: "i18n")
  --help, -h         Show this help message
  --version, -v      Show version information
  `);
}

// Display version information
function showVersion() {
  const packageJson = require('./package.json');
  console.log(`tolgee-merge-namespaces v${packageJson.version}`);
}

// Main function to merge translations
function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  if (options.version) {
    showVersion();
    return;
  }

  const i18nDir = path.join(process.cwd(), options.i18nDir);

  // Check if i18n directory exists
  if (!fs.existsSync(i18nDir)) {
    console.error(`Error: Directory '${i18nDir}' does not exist.`);
    console.log(`Use --dir option to specify a different i18n directory.`);
    process.exit(1);
  }

  console.log(`Using i18n directory: ${i18nDir}`);

  // Get all language codes from the i18n directory
  const languages = new Set();
  try {
    fs.readdirSync(i18nDir)
      .filter(file => file.endsWith('.json'))
      .forEach(file => {
        const lang = path.basename(file, '.json');
        languages.add(lang);
      });
  } catch (error) {
    console.error(`Error reading i18n directory: ${error.message}`);
    process.exit(1);
  }

  // Get all namespaces (directories) in the i18n folder
  let namespaces = [];
  try {
    namespaces = fs.readdirSync(i18nDir)
      .filter(item => {
        const itemPath = path.join(i18nDir, item);
        return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
      });
  } catch (error) {
    console.error(`Error reading namespaces: ${error.message}`);
    process.exit(1);
  }

  // For each namespace, check for language files
  namespaces.forEach(namespace => {
    const namespacePath = path.join(i18nDir, namespace);
    try {
      const namespaceFiles = fs.readdirSync(namespacePath)
        .filter(file => file.endsWith('.json'));

      namespaceFiles.forEach(file => {
        const lang = path.basename(file, '.json');
        languages.add(lang);
      });
    } catch (error) {
      console.error(`Error reading namespace directory ${namespacePath}: ${error.message}`);
      // Continue with other namespaces
    }
  });

  // Process each language
  if (languages.size === 0) {
    console.log('No language files found. Nothing to merge.');
    return;
  }

  console.log(`Found ${languages.size} language(s): ${Array.from(languages).join(', ')}`);

  languages.forEach(lang => {
    console.log(`Processing language: ${lang}`);

    // Start with an empty merged translations object
    let mergedTranslations = {};

    // First, add all namespace translations
    namespaces.forEach(namespace => {
      const namespaceFilePath = path.join(i18nDir, namespace, `${lang}.json`);

      if (fs.existsSync(namespaceFilePath)) {
        try {
          const namespaceContent = fs.readFileSync(namespaceFilePath, 'utf8');
          const namespaceTranslations = JSON.parse(namespaceContent);

          // Merge namespace translations
          mergedTranslations = {...mergedTranslations, ...namespaceTranslations};
          console.log(`  Added translations from namespace: ${namespace}`);
        } catch (error) {
          console.error(`  Error reading namespace file ${namespaceFilePath}: ${error.message}`);
        }
      }
    });

    // Then, add root translations (they have priority)
    const rootFilePath = path.join(i18nDir, `${lang}.json`);

    if (fs.existsSync(rootFilePath)) {
      try {
        const rootContent = fs.readFileSync(rootFilePath, 'utf8');
        const rootTranslations = JSON.parse(rootContent);

        // Root translations override namespace translations
        mergedTranslations = {...mergedTranslations, ...rootTranslations};
        console.log(`  Added translations from root file`);
      } catch (error) {
        console.error(`  Error reading root file ${rootFilePath}: ${error.message}`);
      }
    }

    // Write the merged translations back to the root file
    try {
      fs.writeFileSync(rootFilePath, JSON.stringify(mergedTranslations, null, 2));
      console.log(`  Merged translations written to ${rootFilePath}`);
    } catch (error) {
      console.error(`  Error writing to root file ${rootFilePath}: ${error.message}`);
    }
  });

  // Remove namespace files after merging
  if (namespaces.length === 0) {
    console.log('No namespace directories found. Nothing to clean up.');
  } else {
    console.log('Removing namespace files...');
    namespaces.forEach(namespace => {
      const namespacePath = path.join(i18nDir, namespace);

      // Skip if namespace directory no longer exists
      if (!fs.existsSync(namespacePath)) {
        console.log(`  Namespace directory ${namespacePath} no longer exists, skipping.`);
        return;
      }

      try {
        const namespaceFiles = fs.readdirSync(namespacePath)
          .filter(file => file.endsWith('.json'));

        // Remove each JSON file in the namespace directory
        namespaceFiles.forEach(file => {
          const filePath = path.join(namespacePath, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`  Removed file: ${filePath}`);
          } catch (error) {
            console.error(`  Error removing file ${filePath}: ${error.message}`);
          }
        });

        // Check if directory is empty and remove it if it is
        try {
          const remainingFiles = fs.readdirSync(namespacePath);
          if (remainingFiles.length === 0) {
            try {
              fs.rmdirSync(namespacePath);
              console.log(`  Removed empty directory: ${namespacePath}`);
            } catch (error) {
              console.error(`  Error removing directory ${namespacePath}: ${error.message}`);
            }
          } else {
            console.log(`  Directory not empty, skipping removal: ${namespacePath}`);
          }
        } catch (error) {
          console.error(`  Error checking directory contents ${namespacePath}: ${error.message}`);
        }
      } catch (error) {
        console.error(`  Error reading namespace directory ${namespacePath}: ${error.message}`);
      }
    });
  }

  console.log('Translation merging completed!');
}

// Run the main function
main();
