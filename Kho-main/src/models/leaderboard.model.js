const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: {
    type: String,
    default: "0",
  },

  leaderBoard: {
    type: Array,
    required: false,
    default: [],
  },
});

schema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Leaderboard", schema);
