import { getShardContext } from './lib/shard-context'
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
      const { monitor } = getShardContext({ env } as any);
      await monitor.scheduledCheck();
    } catch (error) {
      console.error('Scheduled shard check failed:', error);
    }
  }
}