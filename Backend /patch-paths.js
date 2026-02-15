#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

function replacePathsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace @/xxx with correct relative paths
    content = content.replace(/require\("@\/([^"]+)"\)/g, (match, modulePath) => {
      // Calculate the relative path from the current file to dist/{modulePath}
      const targetPath = path.join(distDir, modulePath);
      const relPath = path.relative(path.dirname(filePath), targetPath);
      // Normalize to forward slashes and ensure it starts with . for relative imports
      const normalizedRel = relPath.split(path.sep).join('/');
      const finalPath = normalizedRel.startsWith('.') ? normalizedRel : './' + normalizedRel;
      
      console.log(`  Patching: require("@/${modulePath}") -> require("${finalPath}")`);
      return `require("${finalPath}")`;
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e.message);
  }
  return false;
}

function walkDir(dir) {
  let modified = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      modified += walkDir(filePath);
    } else if (file.endsWith('.js')) {
      if (replacePathsInFile(filePath)) {
        modified++;
      }
    }
  }
  
  return modified;
}

console.log('[PreStart] Scanning dist/ for @/ path aliases...');
const modified = walkDir(distDir);
console.log(`[PreStart] Patched ${modified} files`);
