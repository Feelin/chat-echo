import * as vscode from 'vscode';
import { LogManager } from './logManager';

export class AIConversationTracker {
    private isTracking: boolean = false;
    private disposables: vscode.Disposable[] = [];
    private logManager: LogManager;
    private lastClipboardContent: string = '';

    constructor(logManager: LogManager) {
        this.logManager = logManager;
    }

    startTracking() {
        if (this.isTracking) {
            return;
        }

        this.isTracking = true;
        this.setupTracking();
        this.logManager.logOperation('AI_TRACKING_STARTED', {
            message: '开始跟踪AI对话内容'
        });
    }

    stopTracking() {
        if (!this.isTracking) {
            return;
        }

        this.isTracking = false;
        this.disposeTracking();
        this.logManager.logOperation('AI_TRACKING_STOPPED', {
            message: '停止跟踪AI对话内容'
        });
    }

    private setupTracking() {
        const config = vscode.workspace.getConfiguration('chatEcho');
        
        if (!config.get('recordAIChat', true)) {
            return;
        }

        // 监听剪贴板变化（可能包含AI对话内容）
        this.startClipboardMonitoring();

        // 监听特定的AI相关命令
        this.setupAICommandTracking();

        // 监听终端输出（可能包含AI工具的输出）
        this.setupTerminalTracking();
    }

    private disposeTracking() {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    private startClipboardMonitoring() {
        // 定期检查剪贴板内容变化
        const clipboardInterval = setInterval(async () => {
            if (!this.isTracking) {
                clearInterval(clipboardInterval);
                return;
            }

            try {
                const currentContent = await vscode.env.clipboard.readText();
                if (currentContent !== this.lastClipboardContent && currentContent.trim()) {
                    // 检查是否可能是AI对话内容
                    if (this.isLikelyAIContent(currentContent)) {
                        this.logManager.logOperation('AI_CLIPBOARD_CONTENT', {
                            content: currentContent,
                            contentLength: currentContent.length,
                            detectionReason: this.getAIDetectionReason(currentContent)
                        });
                    }
                    this.lastClipboardContent = currentContent;
                }
            } catch (error) {
                // 忽略剪贴板访问错误
            }
        }, 2000); // 每2秒检查一次

        // 确保在停止跟踪时清理定时器
        this.disposables.push({
            dispose: () => clearInterval(clipboardInterval)
        });
    }

    private setupAICommandTracking() {
        // 监听可能与AI相关的命令
        const aiRelatedCommands = [
            'workbench.action.chat.open',
            'workbench.action.chat.openInSidebar',
            'github.copilot.generate',
            'github.copilot.toggleInlineSuggestion',
            'cursor.composer.open',
            'cursor.chat.open'
        ];

        aiRelatedCommands.forEach(commandId => {
            try {
                const disposable = vscode.commands.registerCommand(`chatEcho.track.${commandId}`, (...args) => {
                    this.logManager.logOperation('AI_COMMAND_EXECUTED', {
                        commandId: commandId,
                        arguments: args,
                        timestamp: new Date().toISOString()
                    });
                });
                this.disposables.push(disposable);
            } catch (error) {
                // 命令可能不存在，忽略错误
            }
        });
    }

    private setupTerminalTracking() {
        // 监听终端创建和输出
        this.disposables.push(
            vscode.window.onDidOpenTerminal(terminal => {
                this.logManager.logOperation('TERMINAL_OPENED', {
                    name: terminal.name,
                    processId: terminal.processId
                });
            })
        );

        // 注意：VS Code API 不直接提供终端输出监听
        // 这里我们记录终端的创建和关闭事件
        this.disposables.push(
            vscode.window.onDidCloseTerminal(terminal => {
                this.logManager.logOperation('TERMINAL_CLOSED', {
                    name: terminal.name,
                    processId: terminal.processId
                });
            })
        );
    }

    private isLikelyAIContent(content: string): boolean {
        // 检查内容是否可能来自AI
        const aiIndicators = [
            // 常见的AI助手回复模式
            /^(我|I)\s*(可以|can|will|would|should)\s*(帮助|help|assist)/i,
            /^(根据|based on|according to)/i,
            /^(这是|here is|here's)/i,
            /^(让我|let me)/i,
            
            // 代码相关的AI回复
            /```[\s\S]*```/,
            /^(这段代码|this code|the code)/i,
            /^(以下是|here's the|below is)/i,
            
            // AI工具特有的格式
            /^##\s+/m, // Markdown标题
            /^\*\*.*\*\*$/m, // 粗体文本
            
            // 长度和结构特征
            content.length > 100 && /\n.*\n/.test(content), // 多行且较长
        ];

        return aiIndicators.some(pattern => {
            if (typeof pattern === 'boolean') {
                return pattern;
            }
            return pattern.test(content);
        });
    }

    private getAIDetectionReason(content: string): string[] {
        const reasons: string[] = [];
        
        if (/^(我|I)\s*(可以|can|will|would|should)\s*(帮助|help|assist)/i.test(content)) {
            reasons.push('助手回复模式');
        }
        
        if (/```[\s\S]*```/.test(content)) {
            reasons.push('包含代码块');
        }
        
        if (/^##\s+/m.test(content)) {
            reasons.push('Markdown格式');
        }
        
        if (content.length > 200) {
            reasons.push('内容较长');
        }
        
        if (/\n.*\n/.test(content)) {
            reasons.push('多行结构');
        }

        return reasons.length > 0 ? reasons : ['通用AI内容特征'];
    }

    // 手动记录AI对话的方法
    recordAIConversation(userMessage: string, aiResponse: string, context?: any) {
        if (!this.isTracking) return;

        this.logManager.logOperation('AI_CONVERSATION', {
            userMessage: userMessage,
            aiResponse: aiResponse,
            context: context,
            conversationId: this.generateConversationId(),
            timestamp: new Date().toISOString()
        });
    }

    private generateConversationId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    isCurrentlyTracking(): boolean {
        return this.isTracking;
    }
}