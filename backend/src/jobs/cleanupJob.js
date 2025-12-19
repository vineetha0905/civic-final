const cron = require('node-cron');
const cleanupService = require('../services/cleanupService');

/**
 * Cleanup Cron Job
 * Runs daily to delete resolved issues that have been resolved for more than 5 days
 */
class CleanupJob {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Start the cleanup cron job
   * Runs daily at 2:00 AM
   */
  start() {
    if (this.job) {
      console.log('Cleanup job is already running');
      return;
    }

    // Run daily at 2:00 AM: '0 2 * * *'
    this.job = cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        console.log('Cleanup check already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      console.log(`[${new Date().toISOString()}] Starting cleanup job (deleting resolved issues older than 5 days)...`);

      try {
        const result = await cleanupService.deleteOldResolvedIssues();
        console.log(`[${new Date().toISOString()}] Cleanup job completed:`, {
          deleted: result.deleted,
          message: result.message
        });

        if (result.deleted > 0) {
          console.log(`Deleted ${result.deleted} resolved issue(s) that were resolved more than 5 days ago`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in cleanup job:`, error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log('Cleanup cron job started (runs daily at 2:00 AM)');
  }

  /**
   * Stop the cleanup cron job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('Cleanup cron job stopped');
    }
  }

  /**
   * Manually trigger cleanup (for testing or admin use)
   */
  async runNow() {
    if (this.isRunning) {
      throw new Error('Cleanup check already in progress');
    }

    this.isRunning = true;
    try {
      const result = await cleanupService.deleteOldResolvedIssues();
      return result;
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new CleanupJob();

