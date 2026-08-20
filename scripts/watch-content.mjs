#!/usr/bin/env node

import chokidar from 'chokidar';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '../content');
const simLibDir = path.join(__dirname, '../sim-lib');
const prepareScript = path.join(__dirname, 'prepare-content.mjs');

let isProcessing = false;
let pendingRerun = false;

function runPrepareContent() {
    if (isProcessing) {
        pendingRerun = true;
        return;
    }

    isProcessing = true;
    console.log('\n🔄 Content changed, updating...');

    const start = Date.now();
    const proc = spawn('node', [prepareScript, '--include-drafts'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    proc.on('close', (code) => {
        isProcessing = false;
        const duration = Date.now() - start;

        if (code === 0) {
            console.log(`✅ Content updated in ${duration}ms\n`);
        } else {
            console.error(`❌ Failed to update content (exit code: ${code})\n`);
        }

        if (pendingRerun) {
            pendingRerun = false;
            runPrepareContent();
        } 
    });
}

console.log('👀 Watching content directory for changes...');
console.log(`📁 ${contentDir}`);
console.log(`📁 ${simLibDir}\n`);

const watcher = chokidar.watch([contentDir, simLibDir], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
    }
});

watcher
    .on('add', (filePath) => {
        console.log(`➕ File added: ${path.relative(contentDir, filePath)}`);
        runPrepareContent();
    })
    .on('change', (filePath) => {
        console.log(`📝 File changed: ${path.relative(contentDir, filePath)}`);
        runPrepareContent();
    })
    .on('unlink', (filePath) => {
        console.log(`➖ File removed: ${path.relative(contentDir, filePath)}`);
        runPrepareContent();
    })
    .on('error', (error) => {
        console.error('❌ Watcher error:', error);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping content watcher...');
    watcher.close();
    process.exit(0);
});
