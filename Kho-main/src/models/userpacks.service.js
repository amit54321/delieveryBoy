const db = require("../_helpers/db");
const io = require("../index");
//var schedule = require('node-schedule');
const mongoose = require("mongoose");
const UserPacks = db.UserPacks;
const User = db.User;
const chatPacks = require("./chatPacks");
const missions = require("./missions");
module.exports = {
  sendAllChatJson,
  getChats,
  addChats,
  addInitialChatsAndMissions,
  showDailyReward,
  sendAllMissionsJson,
  getMissions,
  missionDone,
};

async function sendAllChatJson() {
  let allChats = [];
  allChats = chatPacks["chats"];
  return allChats;
}

async function addChats(socket, io, obj, cb) {
  let user = await UserPacks.findOne({ id: obj.id });
  let u = await User.findById(mongoose.Types.ObjectId(obj.id));
  let chats = obj.chats;
  if (u.coins >= 50) {
    u.coins -= 50;
    u.save();
    if (!Array.isArray(user.chatPacks)) {
      user.chatPacks = [];
    }
    user.chatPacks.push(chats);
    user.save();
    cb({
      chatPacks: user.chatPacks,
      user: u,
    });
  } else {
    let s = "WatchAds";
    let descr = "You have not enough coins.Watch videos and earn coins";
    socket.emit("SHOWPOPUP", {
      name: s,
      desc: descr,
    });
  }
}

async function missionDone(socket, io, obj, cb) {
  let user = await UserPacks.findOne({ id: obj.id });
  let id = obj.missionId;
  let missions = [];

  for (let i = 0; i < user.missions.length; i++) {
    if (user.missions[i].id == id) {
      user.missions[i].complete += 1;
      user.markModified("missions");
      if (user.missions[i].complete == user.missions[i].value) {
        let u = await User.findById(obj.id);
        u.coins = u.coins + user.missions[i].win;
        missions.push(user.missions[i]);
        u.save();
      }
      break;
    }
  }
  if (missions.length > 0) {
    socket.emit("MISSIONCOMPLETE", {
      missionDone: missions,
    });
  }
  user.save();
}

async function addInitialChatsAndMissions(id) {
  let user = new UserPacks();
  user.id = id;
  if (!Array.isArray(user.chatPacks)) {
    user.chatPacks = [];
  }
  for (let i = 0; i < 10; i++) {
    user.chatPacks.push(chatPacks["chats"][i]);
  }

  if (!Array.isArray(user.missions)) {
    user.missions = [];
  }

  for (let i = 0; i < missions["missions"].length; i++) {
    user.missions.push(missions["missions"][i]);
  }
  user.save();
  return user.missions;
}

async function getChats(io, obj, cb) {
  let user = await UserPacks.findOne({ id: obj._id });
  cb({
    chatPacks: user.chatPacks,
  });
}

async function getMissions(io, obj, cb) {
  let user = await UserPacks.findOne({ id: obj._id });
  cb({
    missions: user.missions,
  });
}

async function sendAllMissionsJson(id) {
  let user = await UserPacks.findOne({ id: id });
  if (user) {
    console.log(user.missions.length);
    return user.missions;
  } else {
    console.log("USER NOT FOUND  " + id);
  }
}

async function showDailyReward(socket, obj) {
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  let userPacks = await UserPacks.findOne({ id: obj._id });

  if (userPacks.dailyReward == 0) {
    let dailyReward = user.level * 100;
    let s = "DailyReward";
    let descr = "You have earned " + dailyReward + " coins as daily reward";
    socket.emit("SHOWPOPUP", {
      name: s,
      desc: descr,
    });
  }
}
