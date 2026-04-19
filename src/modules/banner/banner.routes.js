const router = require('express').Router();
const controller = require('./banner.controller');
const upload = require('../../middlewares/upload.middleware');

const { protect, isAdmin } = require('../auth/auth.middleware');


router.get('/', protect, controller.getAll);

router.post(
  '/',
  protect,
  isAdmin,
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ]),
  controller.create
);

// ✅ MOVE THIS UP
router.put('/reorder', protect, isAdmin, controller.reorder);

// update AFTER
router.put(
  '/:id',
  protect,
  isAdmin,
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ]),
  controller.update
);

router.delete('/:id', protect, isAdmin, controller.remove);

// REORDER
router.put('/reorder', protect, controller.reorder);
module.exports = router;