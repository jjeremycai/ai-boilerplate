import type { D1Database } from '@cloudflare/workers-types';
import type { 
  Organization, 
  OrganizationMember, 
  CreateOrganizationInput,
  User 
} from '@boilerplate/types';

export class OrganizationService {
  constructor(private db: D1Database) {}

  // Create organization
  async createOrganization(
    userId: string,
    input: CreateOrganizationInput
  ): Promise<Organization> {
    const id = crypto.randomUUID();
    
    // Check if slug is unique
    const existing = await this.db.prepare(
      'SELECT id FROM organizations WHERE slug = ?'
    ).bind(input.slug).first();

    if (existing) {
      throw new Error('Organization slug already exists');
    }

    // Create organization
    await this.db.prepare(`
      INSERT INTO organizations (id, name, slug, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(id, input.name, input.slug, userId).run();

    // Add owner as member
    await this.db.prepare(`
      INSERT INTO organization_members (organization_id, user_id, role, joined_at)
      VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)
    `).bind(id, userId).run();

    const org = await this.getOrganization(id);
    if (!org) throw new Error('Failed to create organization');

    return org;
  }

  // Get organization by ID
  async getOrganization(id: string): Promise<Organization | null> {
    const result = await this.db.prepare(
      'SELECT * FROM organizations WHERE id = ?'
    ).bind(id).first<Organization>();

    return result;
  }

  // Get organization by slug
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const result = await this.db.prepare(
      'SELECT * FROM organizations WHERE slug = ?'
    ).bind(slug).first<Organization>();

    return result;
  }

  // Get user's organizations
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const result = await this.db.prepare(`
      SELECT o.* 
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = ?
      ORDER BY o.created_at DESC
    `).bind(userId).all<Organization>();

    return result.results;
  }

  // Add member to organization
  async addMember(
    organizationId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<void> {
    // Check if user is already a member
    const existing = await this.db.prepare(
      'SELECT user_id FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(organizationId, userId).first();

    if (existing) {
      throw new Error('User is already a member of this organization');
    }

    await this.db.prepare(`
      INSERT INTO organization_members (organization_id, user_id, role, joined_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(organizationId, userId, role).run();
  }

  // Remove member from organization
  async removeMember(organizationId: string, userId: string): Promise<void> {
    // Check if user is owner
    const member = await this.db.prepare(
      'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(organizationId, userId).first<{ role: string }>();

    if (member?.role === 'owner') {
      throw new Error('Cannot remove organization owner');
    }

    await this.db.prepare(
      'DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(organizationId, userId).run();
  }

  // Update member role
  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<void> {
    // Cannot change owner role
    const member = await this.db.prepare(
      'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(organizationId, userId).first<{ role: string }>();

    if (member?.role === 'owner') {
      throw new Error('Cannot change organization owner role');
    }

    await this.db.prepare(
      'UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?'
    ).bind(role, organizationId, userId).run();
  }

  // Get organization members
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const result = await this.db.prepare(`
      SELECT om.*, u.email, u.first_name, u.last_name
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ?
      ORDER BY 
        CASE om.role 
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
        END,
        om.joined_at DESC
    `).bind(organizationId).all<OrganizationMember & User>();

    return result.results.map(member => ({
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.userId,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        createdAt: '',
        updatedAt: '',
      },
    }));
  }

  // Check if user is member of organization
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const result = await this.db.prepare(
      'SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(organizationId, userId).first();

    return !!result;
  }

  // Check user's role in organization
  async getUserRole(
    organizationId: string,
    userId: string
  ): Promise<'owner' | 'admin' | 'member' | null> {
    const result = await this.db.prepare(
      'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(organizationId, userId).first<{ role: 'owner' | 'admin' | 'member' }>();

    return result?.role || null;
  }

  // Transfer ownership
  async transferOwnership(
    organizationId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): Promise<void> {
    // Verify current owner
    const currentRole = await this.getUserRole(organizationId, currentOwnerId);
    if (currentRole !== 'owner') {
      throw new Error('Only the current owner can transfer ownership');
    }

    // Check if new owner is a member
    const newOwnerRole = await this.getUserRole(organizationId, newOwnerId);
    if (!newOwnerRole) {
      throw new Error('New owner must be a member of the organization');
    }

    // Use transaction to ensure atomicity
    await this.db.batch([
      // Update organization owner
      this.db.prepare(
        'UPDATE organizations SET owner_id = ? WHERE id = ?'
      ).bind(newOwnerId, organizationId),
      // Update old owner to admin
      this.db.prepare(
        'UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?'
      ).bind('admin', organizationId, currentOwnerId),
      // Update new owner to owner
      this.db.prepare(
        'UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?'
      ).bind('owner', organizationId, newOwnerId),
    ]);
  }

  // Delete organization
  async deleteOrganization(organizationId: string, userId: string): Promise<void> {
    // Verify user is owner
    const role = await this.getUserRole(organizationId, userId);
    if (role !== 'owner') {
      throw new Error('Only the organization owner can delete the organization');
    }

    // Delete organization (cascade will handle related records)
    await this.db.prepare(
      'DELETE FROM organizations WHERE id = ?'
    ).bind(organizationId).run();
  }
}