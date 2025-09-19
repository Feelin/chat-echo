import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // 扩展开发文件夹的路径
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // 测试文件夹的路径
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // 下载VS Code，解压并运行集成测试
        await runTests({ extensionDevelopmentPath, extensionTestsPath });
    } catch (err) {
        console.error('测试运行失败');
        process.exit(1);
    }
}

main();