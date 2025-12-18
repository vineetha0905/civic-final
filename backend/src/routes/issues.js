const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  validateIssueCreation,
  validateIssueUpdate,
  validateCommentCreation,
  validateObjectId,
  validatePagination,
  validateIssueFilters
} = require('../middleware/validation');

/* ===============================
   SAFE BOUND CONTROLLER METHODS
================================ */
const getIssues = issueController.getIssues.bind(issueController);
const getNearbyIssues = issueController.getNearbyIssues.bind(issueController);
const getIssueStats = issueController.getIssueStats.bind(issueController);
const createIssue = issueController.createIssue.bind(issueController);
const getIssue = issueController.getIssue.bind(issueController);
const updateIssue = issueController.updateIssue.bind(issueController);
const deleteIssue = issueController.deleteIssue.bind(issueController);
const upvoteIssue = issueController.upvoteIssue.bind(issueController);
const removeUpvote = issueController.removeUpvote.bind(issueController);
const getIssueComments = issueController.getIssueComments.bind(issueController);
const addComment = issueController.addComment.bind(issueController);
const getUserIssues = issueController.getUserIssues.bind(issueController);

/* ===============================
   PUBLIC ROUTES
================================ */
router.get('/', validateIssueFilters, validatePagination, optionalAuth, getIssues);
router.get('/nearby', getNearbyIssues);
router.get('/stats', getIssueStats);

/* ===============================
   PROTECTED ROUTES
================================ */
router.post('/', authenticate, validateIssueCreation, createIssue);
router.get('/:id', validateObjectId('id'), optionalAuth, getIssue);
router.put('/:id', authenticate, validateObjectId('id'), validateIssueUpdate, updateIssue);
router.delete('/:id', authenticate, validateObjectId('id'), deleteIssue);

/* ===============================
   UPVOTING
================================ */
router.post('/:id/upvote', authenticate, validateObjectId('id'), upvoteIssue);
router.delete('/:id/upvote', authenticate, validateObjectId('id'), removeUpvote);

/* ===============================
   COMMENTS
================================ */
router.get('/:id/comments', validateObjectId('id'), validatePagination, getIssueComments);
router.post('/:id/comments', authenticate, validateObjectId('id'), validateCommentCreation, addComment);

/* ===============================
   USER ISSUES
================================ */
router.get('/user/:userId', authenticate, validateObjectId('userId'), validatePagination, getUserIssues);

module.exports = router;
