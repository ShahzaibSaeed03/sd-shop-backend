const GameInformation = require('./game-content.model');

const s3 = require('../../config/s3');

exports.getGameInformation = async (
  req,
  res
) => {
  try {

    const data =
      await GameInformation.findOne({
        game: req.params.gameId
      });

    return res.json({
      success: true,
      data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.upsertGameInformation = async (
  req,
  res
) => {
  try {

    const {
      gameInformation
    } = req.body;

    const data =
      await GameInformation.findOneAndUpdate(
        {
          game: req.params.gameId
        },
        {
          game: req.params.gameId,

          gameInformation:
            gameInformation || []
        },
        {
          new: true,
          upsert: true
        }
      );

    return res.json({
      success: true,
      message:
        'Game information updated successfully',
      data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.uploadEditorImage = async (
  req,
  res,
  next
) => {
  try {

    if (!req.file) {

      return res.status(400).json({
        success: false,
        message: 'Image required'
      });

    }

    const result = await s3.upload({

      Bucket: process.env.AWS_BUCKET,

      Key:
        `editor/${Date.now()}-${req.file.originalname}`,

      Body: req.file.buffer,

      ContentType: req.file.mimetype

    }).promise();

    res.json({
      uploaded: true,
      url: result.Location
    });

  } catch (err) {

    next(err);

  }
};