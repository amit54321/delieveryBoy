const mongoose = require("mongoose");

//const MONGODB_URL = "mongodb://127.0.0.1:27017/ludo-api";
const MONGODB_URL =
  "mongodb+srv://amit1234:Nsit_delhi3@cluster0.d7rgz.mongodb.net/DelieveryMan?retryWrites=true&w=majority";
 // mongodb+srv://amit1234:<password>@cluster0.d7rgz.mongodb.net/?retryWrites=true&w=majority

mongoose.connect(MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
});
mongoose.Promise = global.Promise;

module.exports = {
  User: require("../models/user.model"),
  TaskDone: require("../models/taskDone.model"),
  UserPacks: require("../models/userpacks.model"),
  Analytics: require("../models/analytics.model"),
  Room: require("../rooms/room.model"),
  LeaderBoard: require("../models/leaderboard.model"),
  GamePlay: require("../gameplay/gameplay.model"),
  Round: require("../gameplay/round.model"),
  PlayerPegs: require("../gameplay/playerpegs.model"),
  PegsData: require("../gameplay/pegsData.model"),
};
