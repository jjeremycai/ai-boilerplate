import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import type { Env } from '../index';
import { OrganizationService } from '../services/organization.service';
import type { CreateOrganizationInput } from '@boilerplate/types';

const organizations = new Hono<{ Bindings: Env }>();

// Get user's organizations
organizations.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const orgService = new OrganizationService(c.env.DB);
  const orgs = await orgService.getUserOrganizations(auth.userId);
  
  return c.json({ data: orgs });
});

// Create organization
organizations.post('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const input = await c.req.json<CreateOrganizationInput>();
  
  if (!input.name || !input.slug) {
    return c.json({ 
      error: 'Name and slug are required', 
      code: 'INVALID_INPUT' 
    }, 400);
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(input.slug)) {
    return c.json({ 
      error: 'Slug can only contain lowercase letters, numbers, and hyphens', 
      code: 'INVALID_SLUG' 
    }, 400);
  }

  const orgService = new OrganizationService(c.env.DB);
  
  try {
    const org = await orgService.createOrganization(auth.userId, input);
    return c.json({ data: org });
  } catch (error: any) {
    if (error.message === 'Organization slug already exists') {
      return c.json({ 
        error: error.message, 
        code: 'SLUG_EXISTS' 
      }, 400);
    }
    throw error;
  }
});

// Get organization by ID
organizations.get('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const orgService = new OrganizationService(c.env.DB);
  
  // Check if user is member
  const isMember = await orgService.isMember(id, auth.userId);
  if (!isMember) {
    return c.json({ error: 'Not a member of this organization' }, 403);
  }

  const org = await orgService.getOrganization(id);
  if (!org) {
    return c.json({ error: 'Organization not found' }, 404);
  }
  
  return c.json({ data: org });
});

// Get organization members
organizations.get('/:id/members', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const orgService = new OrganizationService(c.env.DB);
  
  // Check if user is member
  const isMember = await orgService.isMember(id, auth.userId);
  if (!isMember) {
    return c.json({ error: 'Not a member of this organization' }, 403);
  }

  const members = await orgService.getMembers(id);
  return c.json({ data: members });
});

// Add member to organization
organizations.post('/:id/members', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const { userId, role } = await c.req.json<{ userId: string; role?: 'admin' | 'member' }>();
  
  if (!userId) {
    return c.json({ 
      error: 'User ID is required', 
      code: 'INVALID_INPUT' 
    }, 400);
  }

  const orgService = new OrganizationService(c.env.DB);
  
  // Check if requester has permission (owner or admin)
  const requesterRole = await orgService.getUserRole(id, auth.userId);
  if (!requesterRole || requesterRole === 'member') {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  try {
    await orgService.addMember(id, userId, role);
    return c.json({ data: { success: true } });
  } catch (error: any) {
    if (error.message === 'User is already a member of this organization') {
      return c.json({ 
        error: error.message, 
        code: 'ALREADY_MEMBER' 
      }, 400);
    }
    throw error;
  }
});

// Update member role
organizations.patch('/:id/members/:userId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id, userId } = c.req.param();
  const { role } = await c.req.json<{ role: 'admin' | 'member' }>();
  
  if (!role || !['admin', 'member'].includes(role)) {
    return c.json({ 
      error: 'Invalid role', 
      code: 'INVALID_INPUT' 
    }, 400);
  }

  const orgService = new OrganizationService(c.env.DB);
  
  // Check if requester has permission (owner only)
  const requesterRole = await orgService.getUserRole(id, auth.userId);
  if (requesterRole !== 'owner') {
    return c.json({ error: 'Only owners can change member roles' }, 403);
  }

  try {
    await orgService.updateMemberRole(id, userId, role);
    return c.json({ data: { success: true } });
  } catch (error: any) {
    if (error.message === 'Cannot change organization owner role') {
      return c.json({ 
        error: error.message, 
        code: 'OWNER_ROLE_IMMUTABLE' 
      }, 400);
    }
    throw error;
  }
});

// Remove member from organization
organizations.delete('/:id/members/:userId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id, userId } = c.req.param();
  const orgService = new OrganizationService(c.env.DB);
  
  // Check if requester has permission (owner or admin, or self)
  const requesterRole = await orgService.getUserRole(id, auth.userId);
  if (!requesterRole || (requesterRole === 'member' && userId !== auth.userId)) {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  try {
    await orgService.removeMember(id, userId);
    return c.json({ data: { success: true } });
  } catch (error: any) {
    if (error.message === 'Cannot remove organization owner') {
      return c.json({ 
        error: error.message, 
        code: 'CANNOT_REMOVE_OWNER' 
      }, 400);
    }
    throw error;
  }
});

// Transfer ownership
organizations.post('/:id/transfer', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const { newOwnerId } = await c.req.json<{ newOwnerId: string }>();
  
  if (!newOwnerId) {
    return c.json({ 
      error: 'New owner ID is required', 
      code: 'INVALID_INPUT' 
    }, 400);
  }

  const orgService = new OrganizationService(c.env.DB);
  
  try {
    await orgService.transferOwnership(id, auth.userId, newOwnerId);
    return c.json({ data: { success: true } });
  } catch (error: any) {
    return c.json({ 
      error: error.message, 
      code: 'TRANSFER_ERROR' 
    }, 400);
  }
});

// Delete organization
organizations.delete('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const orgService = new OrganizationService(c.env.DB);
  
  try {
    await orgService.deleteOrganization(id, auth.userId);
    return c.json({ data: { success: true } });
  } catch (error: any) {
    if (error.message === 'Only the organization owner can delete the organization') {
      return c.json({ 
        error: error.message, 
        code: 'NOT_OWNER' 
      }, 403);
    }
    throw error;
  }
});

export default organizations;