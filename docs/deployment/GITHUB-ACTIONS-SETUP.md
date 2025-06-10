# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions for automatic deployment to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Find your Account ID in the dashboard

2. **API Token**
   - Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Create a new token with these permissions:
     - Account: `Cloudflare Workers Scripts:Edit`
     - Zone: `Zone:Read` (if using custom domains)

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following repository secrets:

### Required Secrets

- **`CLOUDFLARE_API_TOKEN`**
  - Your Cloudflare API token created above
  - Required for deployment

- **`CLOUDFLARE_ACCOUNT_ID`**
  - Found in your Cloudflare dashboard
  - Right sidebar under "Account ID"

## Workflows

### Deploy Workflow (`deploy.yml`)

Automatically deploys to Cloudflare Workers when:
- Code is pushed to the `main` branch
- Manually triggered via GitHub Actions UI

**Features:**
- Builds the web application with Vite
- Deploys backend to Cloudflare Workers
- Serves static assets from the edge
- Verifies deployment success

### Test Workflow (`test.yml`)

Runs tests and checks when:
- Pull requests are opened
- Code is pushed to `main`

**Features:**
- Type checking with TypeScript
- Unit tests with Vitest
- Linting (non-blocking)

## Monitoring Deployments

### View Deployment Status

1. Go to the Actions tab in your repository
2. Click on the latest workflow run
3. View detailed logs for each step

### Common Issues

#### 1. Missing Secrets
```
❌ CLOUDFLARE_API_TOKEN is not set
```
**Solution:** Add the required secrets in repository settings

#### 2. Invalid API Token
```
Authentication error
```
**Solution:** Verify token permissions and regenerate if needed

#### 3. Build Failures
```
Error: Web build output not found!
```
**Solution:** Check that `bun install` and build scripts work locally

#### 4. Account ID Issues
```
Account not found
```
**Solution:** Verify the Account ID matches your Cloudflare dashboard

## Manual Deployment

To trigger a deployment manually:

1. Go to Actions tab
2. Select "Deploy to Cloudflare Workers"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Rollback

If a deployment fails:

1. **Automatic:** Previous version remains live
2. **Manual:** Use wrangler CLI locally:
   ```bash
   wrangler rollback
   ```

## Security Best Practices

1. **Limit Token Scope**
   - Only grant necessary permissions
   - Use separate tokens for different environments

2. **Rotate Tokens Regularly**
   - Update tokens every 90 days
   - Remove unused tokens

3. **Monitor Access**
   - Check Cloudflare audit logs
   - Review GitHub Actions logs

## Debugging

### Enable Debug Logs

Add to your workflow:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

### Local Testing

Test the deployment locally:
```bash
cd apps/backend
wrangler deploy --config wrangler.deploy.toml --dry-run
```

## Performance Tips

1. **Cache Dependencies**
   - Already configured in workflows
   - Speeds up builds significantly

2. **Parallel Jobs**
   - Tests run separately from deployment
   - Faster feedback loop

3. **Conditional Deployment**
   - Only deploy on main branch
   - Skip deployment for documentation changes

## Next Steps

1. Set up your GitHub secrets
2. Push code to trigger deployment
3. Monitor the Actions tab
4. Verify deployment in Cloudflare dashboard

For more information:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)