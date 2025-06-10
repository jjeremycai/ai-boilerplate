import type { D1Database } from '@cloudflare/workers-types';

export async function seedSubscriptionPlans(db: D1Database) {
  console.log('💳 Seeding subscription plans...');
  
  try {
    const plans = [
      {
        id: 'plan_free',
        name: 'Free',
        slug: 'free',
        price_monthly: 0,
        price_yearly: 0,
        features: JSON.stringify([
          '5 projects',
          'Basic support',
          'Community access'
        ]),
        limits: JSON.stringify({
          projects: 5,
          members: 1,
          storage_gb: 1,
          api_calls_per_month: 1000
        })
      },
      {
        id: 'plan_pro',
        name: 'Pro',
        slug: 'pro',
        price_monthly: 999, // $9.99
        price_yearly: 9990, // $99.90
        features: JSON.stringify([
          'Unlimited projects',
          'Priority support',
          'Advanced features',
          'API access',
          'Custom integrations'
        ]),
        limits: JSON.stringify({
          projects: -1, // unlimited
          members: 1,
          storage_gb: 50,
          api_calls_per_month: 100000
        })
      },
      {
        id: 'plan_team',
        name: 'Team',
        slug: 'team',
        price_monthly: 2999, // $29.99
        price_yearly: 29990, // $299.90
        features: JSON.stringify([
          'Everything in Pro',
          'Team collaboration',
          'Admin controls',
          'SSO',
          'Advanced security'
        ]),
        limits: JSON.stringify({
          projects: -1,
          members: 10,
          storage_gb: 500,
          api_calls_per_month: 1000000
        })
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        price_monthly: 9999, // $99.99
        price_yearly: 99990, // $999.90
        features: JSON.stringify([
          'Everything in Team',
          'Unlimited members',
          'Custom limits',
          'SLA',
          'Dedicated support',
          'Custom contracts'
        ]),
        limits: JSON.stringify({
          projects: -1,
          members: -1,
          storage_gb: -1,
          api_calls_per_month: -1
        })
      }
    ];

    // Insert plans if they don't exist
    for (const plan of plans) {
      await db.prepare(`
        INSERT OR IGNORE INTO subscription_plans (id, name, slug, price_monthly, price_yearly, features, limits)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        plan.id,
        plan.name,
        plan.slug,
        plan.price_monthly,
        plan.price_yearly,
        plan.features,
        plan.limits
      ).run();
    }

    console.log('✅ Subscription plans seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed subscription plans:', error);
    throw error;
  }
}

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