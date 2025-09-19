import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('开始运行测试!');

    test('扩展应该被正确激活', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.chat-echo');
        assert.ok(extension);
        
        if (!extension.isActive) {
            await extension.activate();
        }
        
        assert.ok(extension.isActive);
    });

    test('命令应该被正确注册', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'chatEcho.startRecording',
            'chatEcho.stopRecording',
            'chatEcho.viewLogs',
            'chatEcho.clearLogs'
        ];
        
        expectedCommands.forEach(command => {
            assert.ok(commands.includes(command), `命令 ${command} 应该被注册`);
        });
    });
});