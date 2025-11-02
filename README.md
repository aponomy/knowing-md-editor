# Knowing Markdown Editor

A powerful VS Code extension that provides a rich markdown editing experience using Slate.js.

## Features

- **Rich Text Editing**: Edit markdown files with a WYSIWYG-like editor powered by Slate.js
- **Formatting Toolbar**: Quick access to common formatting options (Bold, Italic, Underline, Code)
- **Real-time Sync**: Changes in the editor are synced with the underlying markdown file
- **VS Code Integration**: Seamlessly integrates with VS Code's editor system

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new VS Code window with the extension loaded

### From VSIX

1. Package the extension: `npx vsce package`
2. Install the generated `.vsix` file in VS Code

## Usage

1. Open any `.md` (Markdown) file in VS Code
2. Right-click in the editor and select **"Open with Knowing Markdown Editor"**
3. Alternatively, use the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and search for **"Open with Knowing Markdown Editor"**

The editor will open in a new tab with the Slate.js-based rich text editor.

## Development

### Project Structure

```
knowing-md-editor/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── editor/
│   │   ├── MarkdownEditorProvider.ts  # Custom editor provider
│   │   └── utils.ts              # Utility functions
│   └── webview/
│       ├── index.tsx             # Webview entry point
│       ├── components/
│       │   ├── SlateEditor.tsx   # Main Slate editor component
│       │   └── SlateToolbar.tsx  # Formatting toolbar
│       ├── types/
│       │   └── slate.d.ts        # Slate type definitions
│       └── styles.css            # Editor styles
├── media/
│   ├── reset.css                 # CSS reset
│   ├── vscode.css                # VS Code theme integration
│   └── editor.css                # Editor-specific styles
└── dist/                         # Compiled output
```

### Build Commands

- `npm run compile`: Build the extension for development
- `npm run watch`: Watch mode for development
- `npm run package`: Build for production
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

### Technologies Used

- **TypeScript**: Type-safe development
- **React**: UI components
- **Slate.js**: Rich text editing framework
- **esbuild**: Fast bundling
- **VS Code Extension API**: Custom editor provider

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
