# Knowing Markdown Editor

A powerful VS Code extension that provides a rich markdown editing experience using Slate.js, ported from the knowing-app project.

## Features

- **Rich Text Editing**: Edit markdown files with a WYSIWYG-like editor powered by Slate.js
- **Formatting Toolbar**: Quick access to common formatting options
  - **Bold** (`Ctrl/Cmd + B`)
  - **Italic** (`Ctrl/Cmd + I`)
  - **Underline** (`Ctrl/Cmd + U`)
  - **Code** inline formatting
- **Markdown Elements**: Full support for markdown elements
  - Headings (H1-H6)
  - Lists (ordered and unordered)
  - Links
  - Code blocks
  - Blockquotes
  - Tracked changes (insertions and deletions)
- **Real-time Sync**: Changes in the editor are synced with the underlying markdown file
- **VS Code Integration**: Seamlessly integrates with VS Code's editor system

## Installation

### From Source

1. Clone this repository
   ```bash
   git clone https://github.com/aponomy/knowing-md-editor.git
   cd knowing-md-editor
   ```
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new VS Code window with the extension loaded

### From VSIX (Coming Soon)

1. Package the extension: `npx vsce package`
2. Install the generated `.vsix` file in VS Code

## Usage

1. Open any `.md` (Markdown) file in VS Code
2. The Knowing Markdown Editor will automatically open as the default editor for `.md` files
3. Use the toolbar at the top for quick formatting
4. Edit your markdown with a rich text editing experience

The editor will display in a webview with the Slate.js-based rich text editor, while keeping your markdown file in sync.

## Development

### Project Structure

```
knowing-md-editor/
├── src/
│   ├── extension.ts                    # Main extension entry point
│   ├── editor/
│   │   ├── MarkdownEditorProvider.ts   # Custom editor provider
│   │   └── utils.ts                    # Utility functions
│   └── webview/
│       ├── index.tsx                   # Webview entry point
│       ├── components/
│       │   └── SlateEditor.tsx         # Main Slate editor component
│       ├── slate/
│       │   ├── SlateToolbar.tsx        # Formatting toolbar
│       │   ├── index.ts                # Type definitions
│       │   └── Parts/
│       │       ├── Element.tsx         # Slate element rendering
│       │       ├── Link.tsx            # Link element support
│       │       ├── Markdown.tsx        # Markdown parsing/rendering
│       │       ├── TrackedChanges.tsx  # Tracked changes support
│       │       ├── Serialize.ts        # Slate to markdown
│       │       └── Deserialize.ts      # Markdown to Slate
│       └── styles.css                  # Editor styles
├── media/
│   ├── reset.css                       # CSS reset
│   ├── vscode.css                      # VS Code theme integration
│   └── editor.css                      # Editor-specific styles
├── dist/                               # Compiled output
├── esbuild.js                          # Build configuration
├── package.json                        # Extension manifest
└── tsconfig.json                       # TypeScript configuration
```

### Build Commands

- `npm install`: Install dependencies
- `npm run compile`: Build the extension and run type checking and linting
- `npm run watch`: Watch mode for development (runs TypeScript and esbuild watchers)
- `npm run check-types`: Run TypeScript type checking
- `npm run lint`: Run ESLint
- `npm test`: Run tests

### Technologies Used

- **TypeScript 5.9.3**: Type-safe development with ESNext modules
- **React 18.3.1**: UI components for the webview
- **Slate.js 0.103.0**: Rich text editing framework
- **slate-react 0.110.3**: React integration for Slate
- **slate-history 0.109.0**: Undo/redo support
- **remark-parse & unified**: Markdown parsing
- **remark-slate-transformer**: Markdown ↔ Slate conversion
- **esbuild 0.25.10**: Fast bundling (dual builds: extension + webview)
- **VS Code Extension API**: Custom text editor provider

## Architecture

The extension consists of two main parts:

1. **Extension Host** (`src/extension.ts`, `src/editor/`): Runs in Node.js and manages the VS Code integration
   - Registers the custom editor for `.md` files
   - Manages document lifecycle and synchronization
   - Provides the webview HTML and resources

2. **Webview** (`src/webview/`): Runs in a browser-like environment
   - React-based UI with Slate.js editor
   - Communicates with extension host via VS Code API
   - Handles markdown parsing, editing, and serialization

## Porting from knowing-app

This extension was ported from the [knowing-app](https://github.com/aponomy/knowing-app) project's Slate editor implementation. The following changes were made:

- Removed knowing-app specific dependencies (DocumentBlocks, Tags, Nodes, Articles, Files)
- Removed Material-UI (MUI/@mui/joy) dependencies
- Simplified for standalone markdown editing in VS Code
- Preserved core Slate functionality: markdown parsing, rich text editing, tracked changes, and link support

## Known Issues

- Tracked changes parsing from markdown is not yet implemented (placeholder returns null)
- Some advanced markdown features may not be fully supported yet

## Release Notes

### 0.0.1 (Initial Development)

- ✅ Ported Slate editor from knowing-app
- ✅ Removed knowing-app specific dependencies
- ✅ Created VS Code extension with custom text editor
- ✅ Implemented formatting toolbar
- ✅ Added support for headings, lists, links, code blocks
- ✅ Added tracked changes support (insertions/deletions)
- ✅ Full TypeScript compilation with zero errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE) - see LICENSE file for details

## Credits

Original Slate editor implementation from [knowing-app](https://github.com/aponomy/knowing-app).

---

**Enjoy rich markdown editing in VS Code!**

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
