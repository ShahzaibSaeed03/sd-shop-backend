const GameContent = require('./game-content.model');

exports.getByGame = async (gameId) => {
  return await GameContent.findOne({
    game: gameId,
  }).populate('game');
};

exports.updateContent = async (
  gameId,
  payload
) => {
  return await GameContent.findOneAndUpdate(
    {
      game: gameId,
    },
    payload,
    {
      new: true,
      upsert: true,
    }
  );
};