// modules/plans/plans.routes.js
const router = require('express').Router();
const controller = require('../controller/PlansController');
const authMiddleware = require('../middleware/authMiddleware');

// You can later add role middleware (super_admin)

router.post('/', authMiddleware, controller.createPlan);
router.get('/', controller.getPlans);
router.get('/:id', controller.getPlan);
router.put('/:id', authMiddleware, controller.updatePlan);
router.delete('/:id', authMiddleware, controller.deletePlan);

module.exports = router;