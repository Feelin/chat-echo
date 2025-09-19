import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface LogEntry {
    timestamp: string;
    type: string;
    data: any;
}

export class LogManager {
    private logFilePath!: string;
    private maxFileSize!: number;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.updateConfiguration();
        this.ensureLogDirectory();
    }

    private updateConfiguration() {
        const config = vscode.workspace.getConfiguration('chatEcho');
        const customPath = config.get<string>('logPath', '');
        
        if (customPath) {
            this.logFilePath = path.resolve(customPath, 'chat-echo.log');
        } else {
            // 使用扩展的全局存储路径
            const globalStoragePath = this.context.globalStorageUri.fsPath;
            this.logFilePath = path.join(globalStoragePath, 'chat-echo.log');
        }
        
        this.maxFileSize = config.get<number>('maxLogFileSize', 10) * 1024 * 1024; // 转换为字节
    }

    private async ensureLogDirectory() {
        const logDir = path.dirname(this.logFilePath);
        await fs.ensureDir(logDir);
    }

    async logOperation(type: string, data: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            type,
            data
        };

        const logLine = JSON.stringify(entry) + '\n';
        
        try {
            // 检查文件大小
            if (await fs.pathExists(this.logFilePath)) {
                const stats = await fs.stat(this.logFilePath);
                if (stats.size > this.maxFileSize) {
                    await this.rotateLogFile();
                }
            }

            await fs.appendFile(this.logFilePath, logLine, 'utf8');
        } catch (error) {
            console.error('写入日志失败:', error);
        }
    }

    private async rotateLogFile() {
        const backupPath = this.logFilePath + '.old';
        
        try {
            // 如果备份文件存在，删除它
            if (await fs.pathExists(backupPath)) {
                await fs.remove(backupPath);
            }
            
            // 将当前日志文件重命名为备份文件
            await fs.move(this.logFilePath, backupPath);
        } catch (error) {
            console.error('日志文件轮转失败:', error);
        }
    }

    async getRecentLogs(lines: number = 1000): Promise<string> {
        try {
            if (!(await fs.pathExists(this.logFilePath))) {
                return '';
            }

            const content = await fs.readFile(this.logFilePath, 'utf8');
            const logLines = content.split('\n').filter((line: string) => line.trim());
            
            // 返回最近的指定行数
            const recentLines = logLines.slice(-lines);
            return recentLines.join('\n');
        } catch (error) {
            console.error('读取日志失败:', error);
            return '';
        }
    }

    async clearLogs() {
        try {
            if (await fs.pathExists(this.logFilePath)) {
                await fs.remove(this.logFilePath);
            }
            
            const backupPath = this.logFilePath + '.old';
            if (await fs.pathExists(backupPath)) {
                await fs.remove(backupPath);
            }
        } catch (error) {
            console.error('清空日志失败:', error);
        }
    }

    getLogFilePath(): string {
        return this.logFilePath;
    }
}