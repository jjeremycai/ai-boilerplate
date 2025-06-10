#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const chalk = require('chalk');

const TEMPLATES = {
  lite: {
    name: 'Lite (API Only)',
    description: 'Just API endpoints, no auth, no database',
    time: '15 minutes'
  },
  standard: {
    name: 'Standard (Full Stack)',
    description: 'Web + Mobile + Database + Auth + Chat',
    time: '45 minutes'
  },
  enterprise: {
    name: 'Enterprise (Everything)',
    description: 'All features + monitoring + security + CI/CD',
    time: '60 minutes'
  }
};

function checkCommand(cmd, installCmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    console.log(chalk.green(`✓ ${cmd} found`));
  } catch (error) {
    console.log(chalk.red(`✗ ${cmd} not found`));
    console.log(chalk.yellow(`Install with: ${installCmd}`));
    process.exit(1);
  }
}

function checkPrerequisites() {
  console.log(chalk.blue('\n🔍 Checking prerequisites...\n'));
  
  checkCommand('node', 'Install Node.js from https://nodejs.org');
  checkCommand('npm', 'Install Node.js from https://nodejs.org');
  checkCommand('wrangler', 'npm install -g wrangler');
  checkCommand('git', 'Install Git from https://git-scm.com');
  
  console.log(chalk.green('\n✅ All prerequisites met!\n'));
}

function generateWranglerToml(config) {
  const template = `
name = "${config.projectName}"
main = "worker/src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
vars = { ENVIRONMENT = "production" }

${config.template !== 'lite' ? `
[[d1_databases]]
binding = "DB"
database_name = "${config.projectName}-db"
database_id = "${config.dbId}"

[[kv_namespaces]]
binding = "KV"
id = "${config.kvId}"
preview_id = "${config.kvPreviewId}"

${config.useChat ? `
[[durable_objects.bindings]]
name = "CHAT_ROOMS"
class_name = "ChatRoom"
script_name = "${config.projectName}"

[[durable_objects.bindings]]
name = "USER_SESSIONS"
class_name = "UserSession"
script_name = "${config.projectName}"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom", "UserSession"]
` : ''}
` : ''}

[build]
command = "npm run build:worker"
`.trim();

  fs.writeFileSync('wrangler.toml', template);
}

function generateEnvFiles(config) {
  const webEnv = `
VITE_CLERK_PUBLISHABLE_KEY=${config.clerkPublishableKey || 'your_clerk_publishable_key_here'}
VITE_API_URL=http://localhost:8787
VITE_ENVIRONMENT=development
`.trim();

  const workerEnv = `
CLERK_SECRET_KEY=${config.clerkSecretKey || 'your_clerk_secret_key_here'}
CLERK_PUBLISHABLE_KEY=${config.clerkPublishableKey || 'your_clerk_publishable_key_here'}
ENVIRONMENT=development
AI_GATEWAY_ACCOUNT_ID=your_cloudflare_account_id_here
AI_GATEWAY_ID=your_ai_gateway_id_here
`.trim();

  const mobileEnv = `
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=${config.clerkPublishableKey || 'your_clerk_publishable_key_here'}
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_ENVIRONMENT=development
`.trim();

  fs.writeFileSync('.env', webEnv);
  fs.writeFileSync('.dev.vars', workerEnv);
  fs.writeFileSync('mobile/.env', mobileEnv);
}

function createDemoData(config) {
  if (config.template === 'lite') return;

  const seedScript = `
import type { D1Database } from '@cloudflare/workers-types';

export async function seedDemoData(db: D1Database) {
  console.log('🌱 Seeding demo data...');
  
  try {
    await db.batch([
      db.prepare(\`
        INSERT INTO projects (id, name, description, status, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      \`).bind(
        'demo-project-1',
        'Demo Project',
        'This is a sample project to show how the system works',
        'active',
        '#3B82F6',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(\`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      \`).bind(
        'demo-task-1',
        'demo-project-1',
        'Complete setup',
        'Finish setting up the development environment',
        'completed',
        'high',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(\`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      \`).bind(
        'demo-task-2',
        'demo-project-1',
        'Build first feature',
        'Create your first feature using this boilerplate',
        'todo',
        'medium',
        new Date().toISOString(),
        new Date().toISOString()
      )
    ]);
    
    console.log('✅ Demo data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed demo data:', error);
  }
}
`;

  fs.writeFileSync('worker/src/db/seed.ts', seedScript);
}

async function createCloudflareResources(config) {
  if (config.template === 'lite') return config;

  console.log(chalk.blue('\n📦 Creating Cloudflare resources...\n'));

  try {
    // Create D1 database
    console.log('Creating D1 database...');
    const dbResult = execSync(\`wrangler d1 create \${config.projectName}-db\`, { encoding: 'utf8' });
    const dbIdMatch = dbResult.match(/database_id = "([^"]+)"/);
    config.dbId = dbIdMatch ? dbIdMatch[1] : '';

    // Create KV namespace
    console.log('Creating KV namespace...');
    const kvResult = execSync(\`wrangler kv:namespace create \${config.projectName}-kv\`, { encoding: 'utf8' });
    const kvIdMatch = kvResult.match(/id = "([^"]+)"/);
    config.kvId = kvIdMatch ? kvIdMatch[1] : '';

    // Create preview KV namespace
    const kvPreviewResult = execSync(\`wrangler kv:namespace create \${config.projectName}-kv --preview\`, { encoding: 'utf8' });
    const kvPreviewIdMatch = kvPreviewResult.match(/id = "([^"]+)"/);
    config.kvPreviewId = kvPreviewIdMatch ? kvPreviewIdMatch[1] : '';

    console.log(chalk.green('✅ Cloudflare resources created successfully\n'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create Cloudflare resources:'), error.message);
    console.log(chalk.yellow('You may need to run: wrangler login'));
    process.exit(1);
  }

  return config;
}

async function runDatabaseMigrations(config) {
  if (config.template === 'lite') return;

  console.log(chalk.blue('🗃️  Running database migrations...\n'));

  try {
    execSync('npm run db:migrate', { stdio: 'inherit' });
    
    // Seed demo data
    if (config.seedDemo) {
      execSync('npm run db:seed', { stdio: 'inherit' });
    }
    
    console.log(chalk.green('✅ Database setup complete\n'));
  } catch (error) {
    console.error(chalk.red('❌ Database migration failed:'), error.message);
  }
}

function showSuccessMessage(config) {
  console.log(chalk.green.bold('🎉 Setup Complete!\n'));
  
  console.log(chalk.blue('Next steps:\n'));
  
  if (config.template !== 'lite') {
    console.log('1. Update your API keys in .env and .dev.vars');
    console.log('2. Run: npm run dev:worker');
    if (config.template === 'standard') {
      console.log('3. For mobile: cd mobile && npm run start');
    }
  } else {
    console.log('1. Run: npm run dev:worker');
  }
  
  console.log('\n📚 Resources:');
  console.log('• API: http://localhost:8787');
  console.log('• Health Check: http://localhost:8787/health');
  console.log('• Documentation: ./README.md');
  console.log('• MCP Config: ./claude_mcp_config.json');
  
  if (config.template !== 'lite') {
    console.log('• Demo data: Already loaded with sample projects and tasks');
  }
  
  console.log(chalk.cyan('\n💡 Pro tip: Use Claude Code with the included MCP servers for AI-assisted development!'));
}

async function main() {
  console.log(chalk.blue.bold('🚀 Cloudflare Boilerplate Setup Wizard\n'));
  
  checkPrerequisites();
  
  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-app',
      validate: value => /^[a-z0-9-]+$/.test(value) || 'Use lowercase letters, numbers, and hyphens only'
    },
    {
      type: 'select',
      name: 'template',
      message: 'Choose your template:',
      choices: Object.entries(TEMPLATES).map(([key, template]) => ({
        title: \`\${template.name} (\${template.time})\`,
        description: template.description,
        value: key
      }))
    },
    {
      type: prev => prev === 'lite' ? null : 'confirm',
      name: 'useAuth',
      message: 'Enable Clerk authentication?',
      initial: true
    },
    {
      type: (prev, values) => values.template === 'standard' ? 'confirm' : null,
      name: 'useChat',
      message: 'Enable real-time chat?',
      initial: true
    },
    {
      type: prev => prev === 'lite' ? null : 'confirm',
      name: 'seedDemo',
      message: 'Add demo data (recommended for first-time users)?',
      initial: true
    },
    {
      type: (prev, values) => values.useAuth ? 'text' : null,
      name: 'clerkPublishableKey',
      message: 'Clerk Publishable Key (optional, can add later):'
    },
    {
      type: (prev, values) => values.useAuth ? 'password' : null,
      name: 'clerkSecretKey',
      message: 'Clerk Secret Key (optional, can add later):'
    }
  ]);

  if (!response.projectName) {
    console.log(chalk.red('Setup cancelled'));
    process.exit(0);
  }

  console.log(chalk.blue(\`\n🔧 Setting up \${response.projectName} with \${TEMPLATES[response.template].name} template...\n\`));

  // Create Cloudflare resources
  const config = await createCloudflareResources(response);
  
  // Generate configuration files
  generateWranglerToml(config);
  generateEnvFiles(config);
  
  // Create demo data script
  createDemoData(config);
  
  // Install dependencies
  console.log(chalk.blue('📦 Installing dependencies...\n'));
  execSync('npm install', { stdio: 'inherit' });
  
  if (config.template === 'standard') {
    execSync('cd mobile && npm install', { stdio: 'inherit' });
  }
  
  // Run database migrations
  await runDatabaseMigrations(config);
  
  // Show success message
  showSuccessMessage(config);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };