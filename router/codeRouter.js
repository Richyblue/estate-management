const router = require('express').Router();
const codeController = require('../controller/CodeContoller');
const authMiddleware = require('../middleware/authMiddleware');
const {requireSubscription} = require('../middleware/subMiddleware');
const {requireRole} = require('../middleware/roleMiddleware');
const {checkPlanLimit} = require('../middleware/checkPlanMiddleware');

// 🔹 Create visitor access (resident / tenant)
router.post(
    '/visitor',
    authMiddleware,
    requireSubscription,
    requireRole('e', 't'),
    checkPlanLimit('visitors'), // ✅ HERE
    codeController.createAccessCode
);
// 🔹 Verify visitor (security only)
router.post(
    '/visitor/verify',
    authMiddleware,
    requireSubscription,
    requireRole('s'),
    codeController.verifyAccess
);

// 🔹 Mark exit (security only)
router.post(
    '/visitor/exit',
    authMiddleware,
    requireSubscription,
    requireRole('s'),
    codeController.markExit
);

// 🔹 Get logs (estate admin only)
router.get(
    '/visitor/logs',
    authMiddleware,
    requireSubscription,
    requireRole('e'),
    codeController.getVisitorLogs
);

module.exports = router;