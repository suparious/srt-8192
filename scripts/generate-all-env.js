const { spawn } = require('child_process');
const path = require('path');

async function runScript(scriptPath, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath], {
            cwd,
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
    });
}

async function generateAllEnv() {
    try {
        // Generate backend environment files
        console.log('\nGenerating backend environment files...');
        await runScript(
            path.join('scripts', 'generate-env.js'),
            path.join(__dirname, '..', 'backend')
        );

        // Generate frontend environment files
        console.log('\nGenerating frontend environment files...');
        await runScript(
            path.join('scripts', 'generate-env.js'),
            path.join(__dirname, '..', 'frontend')
        );

        console.log('\nAll environment files generated successfully!');
    } catch (error) {
        console.error('Error generating environment files:', error);
        process.exit(1);
    }
}

generateAllEnv().catch(console.error);