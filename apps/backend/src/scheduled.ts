import { getShardContext } from './lib/shard-context'
import { ShardConsistencyService } from './services/shard-consistency.service'
import type { Env } from './index'

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Check if sharding is enabled
    const hasShards = Object.keys(env).some(key => key.startsWith('DB_VOL_'));
    if (!hasShards) {
      console.log('Sharding not enabled, skipping scheduled shard check');
      return;
    }

    console.log('Running scheduled shard health check...');

    try {
      const { monitor, router, shardedDb } = getShardContext({ env } as any);
      
      // Run shard health monitoring
      await monitor.scheduledCheck();

      // Run consistency checks based on cron trigger
      if (event.cron === '0 */6 * * *') { // Every 6 hours
        console.log('Running shard consistency checks...');
        const consistencyService = new ShardConsistencyService(router, shardedDb);
        
        const results = await consistencyService.runConsistencyChecks();
        
        // Log any failures or warnings
        const issues = results.filter(r => r.status !== 'passed');
        if (issues.length > 0) {
          console.warn('Consistency check issues found:', issues);
          
          // Store results in KV for monitoring dashboard
          if (env.KV_SHARD_METRICS) {
            await env.KV_SHARD_METRICS.put(
              'consistency_check_latest',
              JSON.stringify({
                timestamp: new Date().toISOString(),
                results,
                hasIssues: issues.length > 0
              }),
              { expirationTtl: 86400 * 7 } // Keep for 7 days
            );
          }
        }
      }

      // Run repair job once daily at 2 AM
      if (event.cron === '0 2 * * *') {
        console.log('Running consistency repair job...');
        const consistencyService = new ShardConsistencyService(router, shardedDb);
        
        // First do a dry run
        const dryRunResults = await consistencyService.repairConsistencyIssues(true);
        console.log('Dry run repair results:', dryRunResults);
        
        // If there are repairs to make and they're safe, execute them
        if (dryRunResults.repairs.length > 0) {
          const actualResults = await consistencyService.repairConsistencyIssues(false);
          console.log('Actual repair results:', actualResults);
        }
      }
    } catch (error) {
      console.error('Scheduled shard check failed:', error);
    }
  }
}