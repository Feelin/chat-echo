import * as vscode from 'vscode';
import { LogManager } from './logManager';

export class OperationRecorder {
    private isRecording: boolean = false;
    private disposables: vscode.Disposable[] = [];
    private logManager: LogManager;

    constructor(logManager: LogManager) {
        this.logManager = logManager;
    }

    startRecording() {
        if (this.isRecording) {
            return;
        }

        this.isRecording = true;
        this.setupEventListeners();
        this.logManager.logOperation('RECORDING_STARTED', {
            message: '开始记录用户操作'
        });
    }

    stopRecording() {
        if (!this.isRecording) {
            return;
        }

        this.isRecording = false;
        this.disposeEventListeners();
        this.logManager.logOperation('RECORDING_STOPPED', {
            message: '停止记录用户操作'
        });
    }

    private setupEventListeners() {
        const config = vscode.workspace.getConfiguration('chatEcho');

        // 监听光标位置变化
        if (config.get('recordCursorMovement', true)) {
            this.disposables.push(
                vscode.window.onDidChangeTextEditorSelection(event => {
                    this.recordCursorMovement(event);
                })
            );
        }

        // 监听活动编辑器变化
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.recordActiveEditorChange(editor);
            })
        );

        // 监听文件操作
        if (config.get('recordFileOperations', true)) {
            this.disposables.push(
                vscode.workspace.onDidOpenTextDocument(document => {
                    this.recordFileOperation('OPEN', document);
                }),
                vscode.workspace.onDidSaveTextDocument(document => {
                    this.recordFileOperation('SAVE', document);
                }),
                vscode.workspace.onDidCloseTextDocument(document => {
                    this.recordFileOperation('CLOSE', document);
                })
            );
        }

        // 监听文本变化
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                this.recordTextChange(event);
            })
        );

        // 监听命令执行
        this.disposables.push(
            vscode.commands.registerCommand('chatEcho.recordCommand', (commandId: string, args?: any) => {
                this.recordCommandExecution(commandId, args);
            })
        );
    }

    private disposeEventListeners() {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    private recordCursorMovement(event: vscode.TextEditorSelectionChangeEvent) {
        if (!this.isRecording) return;

        const editor = event.textEditor;
        const selection = event.selections[0];
        
        this.logManager.logOperation('CURSOR_MOVEMENT', {
            filePath: editor.document.uri.fsPath,
            fileName: editor.document.fileName,
            line: selection.active.line + 1, // 转换为1基索引
            character: selection.active.character + 1,
            selectionStart: {
                line: selection.start.line + 1,
                character: selection.start.character + 1
            },
            selectionEnd: {
                line: selection.end.line + 1,
                character: selection.end.character + 1
            },
            isSelection: !selection.isEmpty
        });
    }

    private recordActiveEditorChange(editor: vscode.TextEditor | undefined) {
        if (!this.isRecording) return;

        if (editor) {
            this.logManager.logOperation('EDITOR_FOCUS', {
                filePath: editor.document.uri.fsPath,
                fileName: editor.document.fileName,
                language: editor.document.languageId,
                lineCount: editor.document.lineCount
            });
        } else {
            this.logManager.logOperation('EDITOR_BLUR', {
                message: '编辑器失去焦点'
            });
        }
    }

    private recordFileOperation(operation: string, document: vscode.TextDocument) {
        if (!this.isRecording) return;

        this.logManager.logOperation(`FILE_${operation}`, {
            filePath: document.uri.fsPath,
            fileName: document.fileName,
            language: document.languageId,
            lineCount: document.lineCount,
            isDirty: document.isDirty,
            isUntitled: document.isUntitled
        });
    }

    private recordTextChange(event: vscode.TextDocumentChangeEvent) {
        if (!this.isRecording) return;

        // 只记录有实际内容变化的事件
        if (event.contentChanges.length === 0) return;

        const changes = event.contentChanges.map(change => ({
            range: {
                start: {
                    line: change.range.start.line + 1,
                    character: change.range.start.character + 1
                },
                end: {
                    line: change.range.end.line + 1,
                    character: change.range.end.character + 1
                }
            },
            rangeLength: change.rangeLength,
            text: change.text
        }));

        this.logManager.logOperation('TEXT_CHANGE', {
            filePath: event.document.uri.fsPath,
            fileName: event.document.fileName,
            changes: changes,
            changeCount: event.contentChanges.length
        });
    }

    private recordCommandExecution(commandId: string, args?: any) {
        if (!this.isRecording) return;

        this.logManager.logOperation('COMMAND_EXECUTION', {
            commandId: commandId,
            arguments: args,
            timestamp: new Date().toISOString()
        });
    }

    isCurrentlyRecording(): boolean {
        return this.isRecording;
    }
}