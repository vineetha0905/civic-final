const Issue = require('../models/Issue');

/**
 * Cleanup Service
 * Handles automatic deletion of resolved issues after they've been resolved for 5 days
 */
class CleanupService {
  /**
   * Delete resolved issues that have been resolved for more than 5 days
   * @returns {Promise<Object>} Result object with deletion statistics
   */
  async deleteOldResolvedIssues() {
    try {
      // Calculate the cutoff date: 5 days ago
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // Find all resolved issues that were resolved more than 5 days ago
      const oldResolvedIssues = await Issue.find({
        status: 'resolved',
        resolvedAt: { $exists: true, $lte: fiveDaysAgo }
      });

      if (oldResolvedIssues.length === 0) {
        return {
          success: true,
          deleted: 0,
          message: 'No resolved issues older than 5 days found'
        };
      }

      // Get issue IDs for logging
      const issueIds = oldResolvedIssues.map(issue => issue._id.toString());

      // Delete the issues
      const deleteResult = await Issue.deleteMany({
        status: 'resolved',
        resolvedAt: { $exists: true, $lte: fiveDaysAgo }
      });

      console.log(`Deleted ${deleteResult.deletedCount} resolved issue(s) that were resolved more than 5 days ago`);
      console.log('Deleted issue IDs:', issueIds);

      return {
        success: true,
        deleted: deleteResult.deletedCount,
        issueIds: issueIds,
        message: `Successfully deleted ${deleteResult.deletedCount} resolved issue(s)`
      };
    } catch (error) {
      console.error('Error deleting old resolved issues:', error);
      throw error;
    }
  }

  /**
   * Get statistics about resolved issues that are eligible for deletion
   * @returns {Promise<Object>} Statistics about old resolved issues
   */
  async getCleanupStats() {
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const count = await Issue.countDocuments({
        status: 'resolved',
        resolvedAt: { $exists: true, $lte: fiveDaysAgo }
      });

      return {
        eligibleForDeletion: count,
        cutoffDate: fiveDaysAgo
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }
}

module.exports = new CleanupService();

