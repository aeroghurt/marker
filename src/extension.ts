import * as vscode from 'vscode';

const document = vscode.window.activeTextEditor?.document;
let decorationType: vscode.TextEditorDecorationType;

export async function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('marker.createNewMarker', async () => {
			updateDecorationType();
			const editor = vscode.window.activeTextEditor;

			if (!editor || !document) {
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

			// change Category[] into string[] to be allowed in vscode.window.showQuickPick()
			const existingCategoriesConverted = existingCategories.map(item => ({
				label: item.name,
				colour: item.colour,
				originalRef: item
			}));

			// gets the category the user selected
			const quickPick = await vscode.window.showQuickPick(
				existingCategoriesConverted, {
					placeHolder: 'Select from existing categories, or create one'
				}
			);
			
			if (quickPick) {
				const decorationType = vscode.window.createTextEditorDecorationType({
					backgroundColor: quickPick.colour + `4D`, // along with the background color, sets bg opacity to 30%
					isWholeLine: true,
				});
				editor.setDecorations(decorationType, [range]);
			}
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
							existingCategories.push(new Category(category, colour));
							break;
						case 'closeWindow':
							panel.dispose();
							break;
						case 'error':
							vscode.window.showErrorMessage(message.error);
							break;
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

	function updateDecorationType() {
		if (!existingCategories) {
			return;
		}
	}
}

let markers: Map<string, vscode.Range[]> = new Map();

class Category {
	public name: string; colour: string;
	constructor(name: string, colour: string) {
		this.name = name;
		this.colour = colour;
	}
}

let existingCategories: Category[] = [];

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