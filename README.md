# tolgee-merge-namespaces

A command-line tool to merge translations across namespaces in Tolgee i18n files.

## Installation

You can install the package globally:

```bash
npm install -g tolgee-merge-namespaces
```

Or use it directly with npx:

```bash
npx tolgee-merge-namespaces
```

## Usage

```bash
tolgee-merge-namespaces [options]
```

### Options

- `--dir, -d <path>`: Specify the i18n directory (default: "i18n")
- `--help, -h`: Show help message
- `--version, -v`: Show version information

## What it does

This tool helps you manage translations in Tolgee projects that use namespaces. It:

1. Finds all language files in the i18n directory and its subdirectories
2. Merges translations from namespace directories into the root language files
3. When there are conflicts, it prioritizes translations from the root files
4. Removes the namespace files after merging
5. Removes empty namespace directories

## Example

Suppose you have the following structure:

```
i18n/
  en.json
  de.json
  namespace1/
    en.json
    de.json
  namespace2/
    en.json
```

After running `tolgee-merge-namespaces`, all translations will be merged into the root files (`i18n/en.json` and `i18n/de.json`), and the namespace directories will be removed.

## Testing locally

To test the package locally before publishing:

1. Clone the repository
2. Navigate to the project directory
3. Run `npm link` to create a global symlink
4. Now you can use `tolgee-merge-namespaces` command from anywhere

To unlink after testing:

```bash
npm unlink -g tolgee-merge-namespaces
```

## License

MIT
