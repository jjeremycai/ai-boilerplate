#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Checking for package updates...\n');

try {
  // Check for npm-check-updates
  try {
    execSync('npx npm-check-updates --version', { stdio: 'ignore' });
  } catch {
    console.log('Installing npm-check-updates...');
    execSync('npm install -g npm-check-updates', { stdio: 'inherit' });
  }

  // Run npm-check-updates
  console.log('Checking dependencies...\n');
  const output = execSync('npx npm-check-updates', { encoding: 'utf8' });
  
  if (output.includes('All dependencies match the latest package versions')) {
    console.log('✅ All packages are up to date!');
  } else {
    console.log(output);
    console.log('\n⚠️  Some packages have newer versions available.');
    console.log('Run "npx npm-check-updates -u" to update package.json');
    console.log('Then run "npm install" to install the updates.\n');
    
    // Check for major version updates
    if (output.includes('→')) {
      console.log('📦 Major version updates detected. Review changes carefully before updating.');
    }
  }
} catch (error) {
  console.error('Error checking for updates:', error.message);
  process.exit(1);
}