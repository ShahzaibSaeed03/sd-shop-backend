const mongoose = require('mongoose');

const gameInformationSchema =
  new mongoose.Schema({

    title: {
      type: String
    },

    content: {
      type: String
    },

    sortOrder: {
      type: Number,
      default: 0
    }

  }, {
    _id: true
  });

const schema =
  new mongoose.Schema({

    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      unique: true
    },

    gameInformation: [
      gameInformationSchema
    ]

  }, {
    timestamps: true
  });

module.exports =
  mongoose.model(
    'GameInformation',
    schema
  );