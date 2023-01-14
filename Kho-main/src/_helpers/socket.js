const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const db = require("./db");
const room = require("../rooms/room.service");
const gamePlay = require("../gameplay/gamePlay.service");
const userPacks = require("../models/userpacks.service");
const user = require("../routers/user");

const User = db.User;
const Room = db.Room;
const GamePlay = db.GamePlay;
//const schedule = require('node-schedule');

async function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

module.exports = function (io) {
  console.log("daafvuv" + io);
  let all_users = {};
  io.on("connection", async function (socket) {
    //console.log(
    //   "Connected On Network" + socket.id + "   " + socket.handshake.query.token
    // );
    let secret = "amitscreatingthisprojectToManuplulate";
    let isRevoked = socket.handshake.query.token;


    try{
      // const decoded = jwt.verify(isRevoked.trim(), secret);
      //  all_users[socket.id] = decoded.sub;
      console.log(
        " On Network" + socket.id + "   " + isRevoked
      );
      let user = await User.findById(isRevoked);
      user.socket_id = socket.id;
      user.is_online = 1;
      await user.save();
      socket.emit("UPDATEDUSER", { status: 200, message: user });


      socket.join(isRevoked);

      if (user.game_id != null) {

        let gameplay = await GamePlay.findOne({ game_id: user.game_id });
        if (gameplay) {
          socket.join(user.room_id._id);
          socket.emit("STARTGAME", {
            status: 200,
            gameplay: gameplay,
          });
        }
      }



      console.log(" USER " + user);
    } catch (err) {
      console.log("errrr " + err);

      socket.emit("UnAuthorized", {
        response: "User not authorized",
      });
    }

    socket.on("CREATEROOM", async (obj, cb) => {
      console.log({ obj });
      await room.createRoom(obj, socket, io, cb);
    });
    socket.on("TASKDONE", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.taskDone(io, obj);
    });

    socket.on("CHECKROOM", async (obj, cb) => {
      console.log({ obj });
      await room.checkRoom(obj, socket, io, cb);
    });

    socket.on("JOINROOM", async (obj, cb) => {
      console.log({ obj });
      await room.joinRoom(obj, socket, io, cb);
    });

    socket.on("SETCOINNOW", async (obj, cb) => {
      console.log({ obj });
      await room.setCoin(obj, socket, io, cb);
    });

    socket.on("LEAVEROOM", async (obj, cb) => {
      console.log({ obj });
      await room.leaveRoom(obj, socket, io, cb);
    });

    socket.on("PUBLICROOM", async (obj, cb) => {
      console.log({ obj });
      await room.lookForPublicRoom(obj, socket, io, cb);
    });

    socket.on("CHAT", async (obj, cb) => {
      //  console.log({ obj });
      await room.chat(obj, socket, io, cb);
    });

    socket.on("CHECKGAME", async (obj, cb) => {
      console.log({ obj });
      await room.checkGame(obj, socket, io, cb);
    });

    /* socket.on("SELECTPEG", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.addPlayerPegs(obj, cb)
    }); */



    socket.on("CONSTRUCT", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.construct(io, obj, socket, cb);
    });

    socket.on("SWAP", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.swap(io, obj, socket, cb);
    });
    socket.on("UPGRADE", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.upgrade(io, obj, socket, cb);
    });
    socket.on("QUITGAME", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.quitGame(obj, socket, io);
    });



    socket.on("GETALLCHATS", async (obj, cb) => {
      console.log({ obj });
      await userPacks.getChats(io, obj, cb);
    });

    socket.on("GETALLMISSIONS", async (obj, cb) => {
      console.log({ obj });
      await userPacks.getMissions(io, obj, cb);
    });

    socket.on("MISSIONDONE", async (obj, cb) => {
      console.log({ obj });
      await userPacks.missionDone(socket, io, obj, cb);
    });
    socket.on("MISSIONDONEMANY", async (obj, cb) => {
      console.log({ obj });
      await userPacks.missionDoneMany(socket, io, obj, cb);
    });
    socket.on("ADDCHATPACK", async (obj, cb) => {
      console.log({ obj });
      await userPacks.addChats(socket, io, obj, cb);
    });
    socket.on("DAILYREWARD", async (obj, cb) => {
      console.log({ obj });
      await userPacks.showDailyReward(socket, obj);
    });
    socket.on("USETIMERPACK", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.useTimerPack(obj, cb);
    });
    socket.on("ADDTIMERPACK", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.addTimerPack(obj, cb);
    });
    socket.on("CANCELTIMER", async (obj, cb) => {
      console.log({ obj });
      await gamePlay.cancelTimer(io, obj, socket, cb);
    });
    
    async function playerOffline(socket) {
      console.log({ socket });
      let user = await User.findOne({ socket_id: socket });
      console.log({ user });
      if (user) {
        user.socket_id = "";
        user.is_online = 0;
        await user.save();
      }
    }

    socket.on("disconnect", function () {
      // console.log(" has disconnected from the chat." + socket.id);

      playerOffline(socket.id);
      //  userService.setOfflineUsers(socket, all_users);
      delete all_users[socket.id];
      console.log(all_users);
    });
  });
};
