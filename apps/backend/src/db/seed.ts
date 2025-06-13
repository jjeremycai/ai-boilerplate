import type { D1Database } from '@cloudflare/workers-types';

export async function seedDemoData(db: D1Database) {
  console.log('🌱 Seeding demo data...');
  
  try {
    await db.batch([
      db.prepare(`
        INSERT INTO projects (id, name, description, status, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-project-1',
        'Demo Project',
        'This is a sample project to show how the system works',
        'active',
        '#3B82F6',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(`
        INSERT INTO projects (id, name, description, status, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-project-2',
        'Mobile App Development',
        'Build a React Native app with this boilerplate',
        'active',
        '#10B981',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-task-1',
        'demo-project-1',
        'Complete setup',
        'Finish setting up the development environment',
        'completed',
        'high',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-task-2',
        'demo-project-1',
        'Build first feature',
        'Create your first feature using this boilerplate',
        'in_progress',
        'medium',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-task-3',
        'demo-project-1',
        'Deploy to production',
        'Deploy your app to Cloudflare Workers',
        'todo',
        'low',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-task-4',
        'demo-project-2',
        'Setup mobile navigation',
        'Configure React Navigation for the mobile app',
        'completed',
        'high',
        new Date().toISOString(),
        new Date().toISOString()
      ),
      
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'demo-task-5',
        'demo-project-2',
        'Implement authentication',
        'Add Clerk authentication to mobile app',
        'in_progress',
        'high',
        new Date().toISOString(),
        new Date().toISOString()
      ),
    ]);
    
    console.log('✅ Demo data seeded successfully');
    console.log('📊 Created:');
    console.log('  • 2 demo projects');
    console.log('  • 5 sample tasks');
    console.log('  • Various status examples (todo, in_progress, completed)');
  } catch (error) {
    console.error('❌ Failed to seed demo data:', error);
    throw error;
  }
}