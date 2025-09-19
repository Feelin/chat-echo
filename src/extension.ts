import * as vscode from 'vscode';
import { OperationRecorder } from './operationRecorder';
import { LogManager } from './logManager';
import { AIConversationTracker } from './aiConversationTracker';

let operationRecorder: OperationRecorder;
let logManager: LogManager;
let aiTracker: AIConversationTracker;

export function activate(context: vscode.ExtensionContext) {
    console.log('Chat Echo 扩展已激活');

    // 初始化组件
    logManager = new LogManager(context);
    operationRecorder = new OperationRecorder(logManager);
    aiTracker = new AIConversationTracker(logManager);

    // 注册命令
    const startRecordingCommand = vscode.commands.registerCommand('chatEcho.startRecording', () => {
        operationRecorder.startRecording();
        vscode.window.showInformationMessage('Chat Echo: 开始记录操作');
    });

    const stopRecordingCommand = vscode.commands.registerCommand('chatEcho.stopRecording', () => {
        operationRecorder.stopRecording();
        vscode.window.showInformationMessage('Chat Echo: 停止记录操作');
    });

    const viewLogsCommand = vscode.commands.registerCommand('chatEcho.viewLogs', async () => {
        const logContent = await logManager.getRecentLogs();
        const panel = vscode.window.createWebviewPanel(
            'chatEchoLogs',
            'Chat Echo 操作日志',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );
        
        panel.webview.html = getLogViewerHtml(logContent);
    });

    const clearLogsCommand = vscode.commands.registerCommand('chatEcho.clearLogs', async () => {
        const result = await vscode.window.showWarningMessage(
            '确定要清空所有操作日志吗？',
            '确定',
            '取消'
        );
        
        if (result === '确定') {
            await logManager.clearLogs();
            vscode.window.showInformationMessage('Chat Echo: 日志已清空');
        }
    });

    // 添加到上下文订阅
    context.subscriptions.push(
        startRecordingCommand,
        stopRecordingCommand,
        viewLogsCommand,
        clearLogsCommand
    );

    // 检查配置并自动开始记录
    const config = vscode.workspace.getConfiguration('chatEcho');
    if (config.get('enabled', true)) {
        operationRecorder.startRecording();
        aiTracker.startTracking();
    }

    // 监听配置变化
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('chatEcho')) {
            const newConfig = vscode.workspace.getConfiguration('chatEcho');
            if (newConfig.get('enabled', true)) {
                operationRecorder.startRecording();
                aiTracker.startTracking();
            } else {
                operationRecorder.stopRecording();
                aiTracker.stopTracking();
            }
        }
    });
}

export function deactivate() {
    if (operationRecorder) {
        operationRecorder.stopRecording();
    }
    if (aiTracker) {
        aiTracker.stopTracking();
    }
    console.log('Chat Echo 扩展已停用');
}

function getLogViewerHtml(logContent: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Echo 操作日志</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .log-container {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
            max-height: 80vh;
            overflow-y: auto;
        }
        .log-entry {
            margin-bottom: 10px;
            padding: 8px;
            border-left: 3px solid var(--vscode-textLink-foreground);
            background-color: var(--vscode-textBlockQuote-background);
        }
        .timestamp {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        .operation-type {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
    </style>
</head>
<body>
    <h1>Chat Echo 操作日志</h1>
    <div class="log-container">
        ${formatLogContent(logContent)}
    </div>
</body>
</html>`;
}

function formatLogContent(content: string): string {
    if (!content.trim()) {
        return '<div class="log-entry">暂无日志记录</div>';
    }
    
    const lines = content.split('\n');
    return lines.map(line => {
        if (line.trim()) {
            try {
                const logEntry = JSON.parse(line);
                return `<div class="log-entry">
                    <div class="timestamp">${logEntry.timestamp}</div>
                    <div class="operation-type">${logEntry.type}</div>
                    <div>${JSON.stringify(logEntry.data, null, 2)}</div>
                </div>`;
            } catch {
                return `<div class="log-entry">${line}</div>`;
            }
        }
        return '';
    }).join('');
}