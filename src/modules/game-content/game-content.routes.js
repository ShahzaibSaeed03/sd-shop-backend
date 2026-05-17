const router = require('express').Router();

const multer = require('multer');

const controller = require('./game-content.controller');

const {
  protect,
  isAdmin
} = require('../auth/auth.middleware');

const storage = multer.memoryStorage();

const upload = multer({
  storage
});

router.get(
  '/game-information/:gameId',
  controller.getGameInformation
);

router.put(
  '/game-information/:gameId',
  protect,
  isAdmin,
  controller.upsertGameInformation
);

router.post(
  '/upload-editor-image',
  protect,
  isAdmin,
  upload.single('image'),
  controller.uploadEditorImage
);

module.exports = router;