'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
const stemmer = require('stem-porter');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let monitor;

    // enable BeSimple
    let enable = vscode.commands.registerCommand('extension.enableBeSimple', () => {
        if (!monitor) {
            vscode.window.showInformationMessage('Start To Be Simple!');
            monitor = new ContentMonitor();
            console.log(monitor);
        }
        else {
            vscode.window.showInformationMessage('Why you want to enable sth already enabled?');
        }
    });


    // disable BeSimple
    let disable = vscode.commands.registerCommand('extension.disableBeSimple', () => {
        if (monitor) {
            vscode.window.showInformationMessage('Finally you cannot bear it any more! lol');
            monitor.dispose();
            monitor = null;
        }
        else {
            vscode.window.showInformationMessage('Whom to disable?');
        }
    });

    // add word into vocabulary
    let addword = vscode.commands.registerCommand('extension.addWord', () => {
        if (!monitor) {
            vscode.window.showErrorMessage("404: No Monitor Found.");
            return;
        }
        vscode.window.showInputBox({ prompt: 'Type word to add: ' }).then(
            (word) => {
                monitor.addWord(word);
                vscode.window.showInformationMessage(`Successfully add [${stemmer(word)}] for [${word}].`);
            }
        );
    });

    // TODO: removeWord / ListStems(GUI)

    context.subscriptions.push(enable);
    context.subscriptions.push(disable);
    context.subscriptions.push(addword);
}

class ContentMonitor {
    private _vocabulary;
    private _disposable: vscode.Disposable;
    constructor() {
        this._vocabulary = vscode.workspace.getConfiguration('besimple').get('stems');
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        this._disposable = vscode.Disposable.from(...subscriptions);
    }
    dispose() {
        this._disposable.dispose();
        console.log("dispose");
    }

    public addWord(word: string) {
        let stem = stemmer(word);
        if (this._vocabulary.indexOf(stem) === -1) {
            this._vocabulary.push(stem);
        }
    }

    private _getLastWord(docContent: string): string {
        let words = docContent.split(/[^-'0-9a-zA-Z']+/);
        if (words.length <= 1) {
            return "";
        }
        else {
            return words[words.length - 2];
        }
    }

    private _onEvent() {
        let doc = vscode.window.activeTextEditor.document;
        let docContent = doc.getText();
        if (docContent.length <= 0 || docContent[docContent.length - 1].match(/[-'0-9a-zA-Z]/)) {
            return;
        }
        let lastWord = this._getLastWord(docContent);

        if (lastWord.match(/^[0-9]+$/)
            || this._vocabulary.indexOf(lastWord) >= 0
            || this._vocabulary.indexOf(lastWord.toLowerCase()) >= 0
            || this._vocabulary.indexOf(stemmer(lastWord)) >= 0
            || this._vocabulary.indexOf(stemmer(lastWord.toLowerCase())) >= 0
        ) {
            return;
        }
        let pos = docContent.lastIndexOf(lastWord);
        let range = new vscode.Range(doc.positionAt(pos), doc.positionAt(docContent.length));
        let edit = new vscode.WorkspaceEdit();
        edit.replace(doc.uri, range, "");
        vscode.workspace.applyEdit(edit);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}