import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('marker.createNewMarker', async () => {
			const editor = vscode.window.activeTextEditor;

			if (!editor) {
				vscode.window.showWarningMessage(`No active editor found.`);
				return;
			}

			const selection = editor.selection;
			const start = selection.start;
			const end = selection.end;
			const range = new vscode.Range(start, end);

			const documentUri = editor.document.uri.toString();
			const existingMarkers = markers.get(documentUri) || [];
			existingMarkers.push(range);
			markers.set(documentUri, existingMarkers);

			const quickPick = await vscode.window.showQuickPick(
				existingCategories, {
					placeHolder: 'Select from existing categories, or create one'
				}
			);
		}
	);
	context.subscriptions.push(disposable);
	// disposable = vscode.commands.registerCommand('marker.deleteMarker', deleteMarker);
	// context.subscriptions.push(disposable);
	// disposable = vscode.commands.registerCommand('marker.deleteAllMarkers', deleteAllMarkers);
	// context.subscriptions.push(disposable);
	context.subscriptions.push(
		vscode.commands.registerCommand('marker.createNewCategory', () => {
			const panel = vscode.window.createWebviewPanel(
				'panel',
				'Create a new category',
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			panel.webview.html = getWebViewContent();

			panel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'getInfo':
							const colour = message.colour;
							const category = message.category;
							let newCategory = new Category(category, colour);
							existingCategories.push(newCategory.name);
							existingCategoriesColours.push(newCategory.colour);
							return;
						case 'closeWindow':
							panel.dispose();
						case 'error':
							vscode.window.showErrorMessage(message.error);
					}
				},
				undefined,
				context.subscriptions
			);
		})
	);

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			reapply(editor);
		}
	}, null, context.subscriptions);

	const hoverProvider = vscode.languages.registerHoverProvider('*', {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			const range = document.getWordRangeAtPosition(position);
			const word = document.getText(range);
			const hoverString = new vscode.MarkdownString();
			hoverString.appendMarkdown(`## Main category:\n\n`);
			hoverString.appendMarkdown(``);
			hoverString.appendMarkdown(`### Sub categories:\n\n`);
			hoverString.appendMarkdown(``);
			return new vscode.Hover(hoverString);
		}
	});
	context.subscriptions.push(hoverProvider);
}

let markers: Map<string, vscode.Range[]> = new Map();

class Category {
	public name: string; colour: string;
	constructor(name: string, colour: string) {
		this.name = name;
		this.colour = colour;
	}
}

let existingCategories: string[] = [`Create New Category`];
let existingCategoriesColours: string[] = [];

existingCategories.forEach((item) => {
	const decorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: existingCategoriesColours[existingCategories.indexOf(item)],
		isWholeLine: true
	});
});

function deleteMarker() {

}

function deleteAllMarkers() {
	
}

function getWebViewContent() {
	return `<!DOCTYPE html>
	<html lang='en'>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Create a new category</title>
	</head>
	<body>
		<form>
			<label>New category</label>
			<input id="category" type="text">
			<label>Colour</label>
			<input id="colour" type="color">
			<input id="submit" type="submit" value="Create">
		</form>
		<script>
			const vscode = acquireVsCodeApi();
			let categoryInput;
			let colourInput;
			document.getElementById('colour').addEventListener('input', (event) => {
				colourInput = event.target.value;
			})
			document.getElementById('submit').onclick = () => {
				categoryInput = document.getElementById('category').value;
				if (category !== undefined && colour !== '#000000') {
					vscode.postMessage({
						command: 'getInfo',
						category: categoryInput,
						colour: colourInput
					})
					vscode.postMessage({
						command: 'closeWindow'
					})
				} else {
					vscode.postMessage({
						command: 'error',
						error: 'Error, could not create new category.'
					})
				}
			}
		</script>
	</body>`;
}

function reapply(editor: vscode.TextEditor) {
	
}

export function deactivate() {}