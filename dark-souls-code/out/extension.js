"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
let decorationType;
let lastPlayed = 0;
function activate(context) {
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
        // Avoid git internals and settings files if needed
        if (!document.fileName.includes('.git')) {
            triggerEffect(context, 'FILE SAVED');
        }
    }));
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const gitPath = path.join(workspaceFolders[0].uri.fsPath, '.git');
        if (fs.existsSync(gitPath)) {
            const commitWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(gitPath, 'logs/HEAD'));
            context.subscriptions.push(commitWatcher.onDidChange(() => triggerEffect(context, 'CODE COMMITTED')));
            const pushWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(gitPath, 'refs/remotes/**/*'));
            context.subscriptions.push(pushWatcher.onDidChange(() => triggerEffect(context, 'CODE PUSHED')));
        }
    }
}
function triggerEffect(context, text) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        showDecoration(context, editor, text);
    }
    // Debounce sound: 2 seconds
    const now = Date.now();
    if (now - lastPlayed > 2000) {
        lastPlayed = now;
        playSound(context);
    }
}
function playSound(context) {
    const config = vscode.workspace.getConfiguration('darkSouls');
    if (config.get('enableSound')) {
        const soundPath = path.join(context.extensionPath, 'media', 'sound.wav');
        if (fs.existsSync(soundPath)) {
            // Use PowerShell to play sound (Windows specific)
            // PlaySync ensures it plays fully before the process exits context, but we use async exec to not block extension host.
            // We rely on debounce to prevent overlap.
            const psCommand = `(New-Object Media.SoundPlayer '${soundPath}').PlaySync()`;
            cp.exec(`powershell -c "${psCommand}"`, { timeout: 3000 }, (err) => {
                if (err) {
                    console.error('Failed to play sound:', err);
                }
            });
        }
    }
}
function showDecoration(context, editor, text) {
    if (decorationType) {
        decorationType.dispose();
    }
    const fontPath = path.join(context.extensionPath, 'media', 'OptimusPrinceps.ttf');
    let fontBase64 = '';
    try {
        fontBase64 = fs.readFileSync(fontPath).toString('base64');
    }
    catch (e) {
        console.error('Could not read font file', e);
    }
    // Restore Gold Colors
    // Text: #e7c15c
    // Text Shadow (simulated with filter): #e77c5c
    const svgContent = `
    <svg width="1000" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'OptimusPrinceps';
            src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
          }
          .text {
            font-family: 'OptimusPrinceps', serif;
            fill: #e7c15c;
            font-size: 90px;
            text-anchor: middle;
            dominant-baseline: middle;
            opacity: 0;
            animation: bounceIn 4s ease-in-out forwards;
            filter: drop-shadow(0 0 10px #e77c5c);
          }
          @keyframes bounceIn {
             0% { opacity: 0; transform: scale(1.1); }
             15% { opacity: 1; transform: scale(1); }
             85% { opacity: 1; transform: scale(1); }
             100% { opacity: 0; transform: scale(0.9); }
          }
        </style>
      </defs>
      <text x="50%" y="50%" class="text">${text}</text>
    </svg>
    `;
    const svgBase64 = Buffer.from(svgContent).toString('base64');
    const dataUri = vscode.Uri.parse(`data:image/svg+xml;base64,${svgBase64}`);
    // Use 'before' decoration with zero size to avoid layout shift,
    // then use 'textDecoration' CSS hack to position it fixed in the center of the screen.
    // 'pointer-events: none' allows clicking through.
    decorationType = vscode.window.createTextEditorDecorationType({
        before: {
            contentIconPath: dataUri,
            width: '0px',
            height: '0px',
            // The following CSS is injected into the style attribute of the pseudo-element container.
            // position: fixed puts it relative to the viewport window.
            // We center it: top 50%, left 50%, translate -50% -50%.
            // We force a large width/height for the container to hold the SVG.
            textDecoration: `none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1000px; height: 300px; z-index: 99999; pointer-events: none;`
        }
    });
    // Attach to the first visible line so it is always rendered.
    const ranges = editor.visibleRanges;
    if (ranges.length > 0) {
        const startPos = ranges[0].start;
        const range = new vscode.Range(startPos, startPos);
        editor.setDecorations(decorationType, [range]);
    }
    setTimeout(() => {
        decorationType === null || decorationType === void 0 ? void 0 : decorationType.dispose();
        decorationType = undefined;
    }, 4000);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map