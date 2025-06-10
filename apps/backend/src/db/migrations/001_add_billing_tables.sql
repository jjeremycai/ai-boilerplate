-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organization members junction table
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT UNIQUE,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER, -- in cents
  features JSON, -- JSON array of feature strings
  limits JSON, -- JSON object with limit values (e.g., {"projects": 10, "members": 5})
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User/Organization subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  user_id TEXT,
  organization_id TEXT,
  plan_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  CHECK ((user_id IS NOT NULL AND organization_id IS NULL) OR (user_id IS NULL AND organization_id IS NOT NULL))
);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  user_id TEXT,
  organization_id TEXT,
  stripe_payment_method_id TEXT UNIQUE,
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.
  last4 TEXT,
  brand TEXT, -- For cards: visa, mastercard, etc.
  exp_month INTEGER, -- For cards
  exp_year INTEGER, -- For cards
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CHECK ((user_id IS NOT NULL AND organization_id IS NULL) OR (user_id IS NULL AND organization_id IS NOT NULL))
);

-- Invoices/Payment history
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  subscription_id TEXT NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount_paid INTEGER NOT NULL, -- in cents
  amount_due INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_pdf TEXT, -- URL to PDF
  hosted_invoice_url TEXT, -- Stripe hosted invoice page
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Usage tracking (for usage-based billing)
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  subscription_id TEXT NOT NULL,
  metric_name TEXT NOT NULL, -- e.g., 'api_calls', 'storage_gb', 'team_members'
  quantity INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Add tier-related columns to users table
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team', 'enterprise'));
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'paused'));

-- Add organization_id to projects table to support organization-owned projects
ALTER TABLE projects ADD COLUMN organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_organization_id ON payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_id ON usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp);

-- Triggers to update timestamps
CREATE TRIGGER IF NOT EXISTS update_organizations_timestamp 
AFTER UPDATE ON organizations
BEGIN
  UPDATE organizations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_subscription_plans_timestamp 
AFTER UPDATE ON subscription_plans
BEGIN
  UPDATE subscription_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp 
AFTER UPDATE ON subscriptions
BEGIN
  UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, features, limits) VALUES
  ('Free', 'free', 0, 0, '["5 projects", "Basic support", "Community access"]', '{"projects": 5, "members": 1, "storage_gb": 1}'),
  ('Pro', 'pro', 999, 9990, '["Unlimited projects", "Priority support", "Advanced features", "API access"]', '{"projects": -1, "members": 1, "storage_gb": 50}'),
  ('Team', 'team', 2999, 29990, '["Everything in Pro", "Team collaboration", "Admin controls", "SSO"]', '{"projects": -1, "members": 10, "storage_gb": 500}'),
  ('Enterprise', 'enterprise', 9999, 99990, '["Everything in Team", "Unlimited members", "Custom limits", "SLA", "Dedicated support"]', '{"projects": -1, "members": -1, "storage_gb": -1}');