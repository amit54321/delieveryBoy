const board = require("./board");
const db = require("../_helpers/db");
const io = require("../index");
//var schedule = require('node-schedule');
const mongoose = require("mongoose");
const GamePlay = db.GamePlay;
const PlayerPegs = db.PlayerPegs;
const User = db.User;
const Round = db.Round;
const Room = db.Room;
const UserPacks = db.UserPacks;
const room = require("../rooms/room.service");

module.exports = {
  quitGame,
  endGame,
  construct,
  upgrade,
  taskDone,
  swap,
  missionDone,
  missionDoneMany,
  useTimerPack,
  addTimerPack,
  cancelTimer
};
async function resetCoinsById(id, coin) {

  User.findByIdAndUpdate(
    id,
    {

      $inc: { "coins": coin },

    },
    { new: true },
    function (err, doc) {
      if (err) {
        throw err;
      } else {
        console.log("Updated User");
      }
    }
  );

}
async function taskDone(io, obj) {
  let game = await GamePlay.findOne({ game_id: obj.game_id });
  if (game) {
    for (let i = 0; i < game.tasksDone.length; i++) {
      if (game.tasksDone[i].id == obj.id) {
        game.tasksDone[i].taskDone.push(obj.taskId);

        io.to(obj.game_id).emit("TASKRECEIVED", { status: 200, message: obj });

        game.markModified("tasksDone");
        await game.save();
        if (game.tasksDone[i].taskDone.length >= 10) {

          game.winnerId = obj.id;
          resetCoinsById(obj.id, 500);
          io.to(obj.game_id).emit("GAMEEND", { status: 200, message: game });
          endGame(obj.game_id, io);
          await game.save();
        }
        break;
      }

    }

  }
}

async function swap(io, obj, socket, cb) {
  console.log("swap calls " + obj.id);
  let user = await User.findById(obj.id);
  if (user) {


    if (!Array.isArray(user.restaurants)) {
      user.restaurants = [];
    }
    let d1r, d2r, d1l, d2l;
    let index1, index2;
    for (let i = 0; i < user.restaurants.length; i++) {
      if (user.restaurants[i].plot_id == obj.plot_id1) {
        index1 = i;
        d1r = user.restaurants[i].restaurant_id;
        d1l = user.restaurants[i].level;
        for (let j = 0; j < user.restaurants.length; j++) {
          if (user.restaurants[j].plot_id == obj.plot_id2) {
            index2 = j;
            d2r = user.restaurants[j].restaurant_id;
            d2l = user.restaurants[j].level;

            i = user.restaurants.length;
            break;
          }
        }

      }
    }
    user.restaurants[index1].restaurant_id = d2r;
    user.restaurants[index1].level = d2l;

    user.restaurants[index2].restaurant_id = d1r;
    user.restaurants[index2].level = d1l;
    //  console.log("construct calls " + d1.restaurant_id +"   d2  "+d2.restaurant_id);
    user.markModified("restaurants");
    await user.save();
    io.to(user._id).emit("SWAPFINISH", { status: 200, message: obj });
    io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });

  }
}

async function missionDoneMany(_id, missionId, obj, socket) {
  let user = await UserPacks.findOne({ id: _id });

  let missions = [];

  if (user && user.missions) {
    for (let i = 0; i < user.missions.length; i++) {
      for (let j = 0; j < missionId.length; j++) {
        let id = missionId[j];
        console.log("construct calls " + missionId[j] + "   " + user.missions[i].id + "    " + id)
        if (user.missions[i].id == id) {
          user.missions[i].complete += 1;
          user.markModified("missions");
          if (user.missions[i].complete == user.missions[i].value) {
            let u = await User.findById(obj.id);
            if (u) {
              u.coins = u.coins + user.missions[i].win;
              missions.push(user.missions[i]);
              await u.save();
            }

          }

        }
      }
    }
    ;
    if (missions.length > 0) {
      socket.emit("MISSIONCOMPLETE", {
        missionDone: missions,
      });
    }
    user.save();
  }
}

async function missionDone(_id, missionId, obj, socket) {
  let user = await UserPacks.findOne({ id: _id });
  let id = missionId;
  let missions = [];

  if (user && user.missions) {
    for (let i = 0; i < user.missions.length; i++) {
      if (user.missions[i].id == id) {
        user.missions[i].complete += 1;
        user.markModified("missions");
        if (user.missions[i].complete == user.missions[i].value) {
          let u = await User.findById(obj.id);
          if (u) {
            u.coins = u.coins + user.missions[i].win;
            missions.push(user.missions[i]);
            await u.save();
          }
        }
        break;
      }

    }
    if (missions.length > 0) {
      socket.emit("MISSIONCOMPLETE", {
        missionDone: missions,
      });
    }
    await user.save();
  }
}
async function construct(io, obj, socket, cb) {
  console.log("construct calls " + obj.id);
  let user = await User.findById(obj.id);
  if (user) {
    if (!Array.isArray(user.timers)) {
      user.timers = [];
    }
    let endD = Date.now() + obj.timer * 1000;
    let data = {
      type: 1,
      plot_id: obj.plot_id,
      restaurant_id: obj.restaurant_id,
      level: 1,
      timer: obj.timer,
      end: endD
    };
    user.timers.push(data);
    user.coins = user.coins - obj.cost;
    user.markModified("timers");
  
    cb({
      status: 200,
      message: data,
    });
    io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });
    let t = obj.timer * 1000;
    var timer =setTimeout(async () => {
      user.timers.pop(data);
      let data2 = {
        plot_id: obj.plot_id,
        restaurant_id: obj.restaurant_id,
        level: 1,
      };
      if (!Array.isArray(user.restaurants)) {
        user.restaurants = [];
      }
      //  resetCoinsById( obj.id,-obj.cost);
    
      user.restaurants.push(data2);
      user.timerId = null;
      user.markModified("restaurants");
      await user.save()


      io.to(user._id).emit("CONSTRUCTFINISH", { status: 200, message: data2 });
      io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });

      let m = [];
      m.push(3);
      m.push(4);
      m.push(5);
      m.push(6);
      missionDoneMany(obj.id, m, obj, socket)
    }, t);
    user.timerId =timer;
    console.log("timer "+timer);
    await user.save();
    //cancelTimer(io, obj, socket, cb,timer);
  }
}

async function cancelTimer(io, obj, socket, cb,timer) {
  let user = await User.findById(obj.id);
  if (user && user.timerId!=null) {
   
   // let endD = Date.now() +   (user.timers[0].timer+20) * 1000;
    let endD = Date.now() +   1000;
    let data = {
      type: 1,
      plot_id: user.timers[0].plot_id,
      restaurant_id: user.timers[0].restaurant_id,
      level: user.timers[0].level,
      timer:  1,
      end: endD
    };
    while(user.timers.length>0)
    {
      user.timers.pop();
    }
   // user.timers.length=0;
    user.timers.push(data);
    user.coins = user.coins - obj.cost;
    user.markModified("timers");
    console.log("CANCEL TIMER" +user.timerId)
    clearTimeout(user.timerId);
    cb({
      status: 200,
      message: data,
    });
    io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });
    let t = 1000;
    var timer =setTimeout(async () => {
     
      
   
   
      if (!Array.isArray(user.restaurants)) {
        user.restaurants = [];
      }
        //resetCoinsById( obj.id,-obj.cost);
     
        let l = 0;
        for (let j = 0; j < user.restaurants.length; j++) {
          if (user.timers[0].plot_id == user.restaurants[j].plot_id) {
            l = user.restaurants[j].level;
            user.restaurants[j].level = l + 1;
           
            break;
          }
  
        }
        user.markModified("restaurants");
        let data2 = {
          plot_id:user.timers[0].plot_id,
          restaurant_id: user.timers[0].restaurant_id,
          level: l + 1
        };
        
     //   user.timers.pop(data);
     while(user.timers.length>0)
     {
       user.timers.pop();
     }
      user.timerId = null;
     
      await user.save()

      

      io.to(user._id).emit("UPGRADEFINISH", { status: 200, message: data2 });
      io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });

      let m = [];
      m.push(7);
      m.push(12);
      m.push(13);
      m.push(14);
      m.push(15);
      missionDoneMany(obj.id, m, obj, socket)
     
    }, t);
  }
   user.timerId =timer;
    console.log("timer "+timer);
    await user.save();
}
async function upgrade(io, obj, socket, cb) {
  console.log("upgrade calls " + obj.id);
  let user = await User.findById(obj.id);
  if (user ) {
    if (!Array.isArray(user.timers)) {
      user.timers = [];
    }
    let endD = Date.now() + obj.timer * 1000;
    let data = {
      type: 1,
      plot_id: obj.plot_id,
      restaurant_id: obj.restaurant_id,
      level: obj.level + 1,
      timer: obj.timer,
      end: endD
    };
    user.timers.push(data);
    user.coins = user.coins - obj.cost;
    user.markModified("timers");
    await user.save();
    cb({
      status: 200,
      message: data,
    });
    io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });
    let t = obj.timer * 1000;
    var timer = setTimeout(async () => {
      user.timers.pop(data);

      let l = 0;
      for (let j = 0; j < user.restaurants.length; j++) {
        if (obj.plot_id == user.restaurants[j].plot_id) {
          l = user.restaurants[j].level;
          user.restaurants[j].level = l + 1;
          break;
        }

      }
     
      user.timerId = null;
      user.markModified("restaurants");
      await user.save()
      let data2 = {
        plot_id: obj.plot_id,
        restaurant_id: obj.restaurant_id,
        level: l + 1
      };

      //  resetCoinsById( obj.id,-obj.cost);
      //if (!Array.isArray( user.restaurants)) {
      //   user.restaurants = [];
      //  }
      //  user.restaurants.push(data2);

      io.to(user._id).emit("UPGRADEFINISH", { status: 200, message: data2 });
      io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });

      let m = [];
      m.push(7);
      m.push(12);
      m.push(13);
      m.push(14);
      m.push(15);
      missionDoneMany(obj.id, m, obj, socket)
     
    }, t);
    user.timerId =timer;
    await user.save();
    console.log("timer "+timer);
  }
}




async function aiTurn(io, round, id, pegType, color) {
  let data = { _id: id, game_id: round.gameId, rolled: true };
  let randomTime = (Math.floor(Math.random() * 10) + 3) * 1000;
  setTimeout(async () => {
    console.log("dice thrown");
    await diceRolled(io, data);
    let pegId = 0;
    if (round.pegsCanMove.length > 0) {
      let r = 0;
      if (round.pegsCanMove.length > 1) {
        r = await selectPegByAi(
          round.turnId,
          pegType,
          round.diceNumber,
          round.gameId,
          color
        );
      }
      pegId = round.pegsCanMove[r];
      let pegT = pegType[r].pegType;
      let data2 = {
        id: id,
        pegId: pegId,
        pegType: pegT,
        game_id: round.gameId,
      };
      let randomTime = (Math.floor(Math.random() * 10) + 3) * 1000;
      setTimeout(async () => {
        console.log("round change");
        roundChange(io, data2);
      }, 3000);
    } else {
      console.log("round change");
      let data2 = {
        id: id,
        pegId: pegId,
        pegType: null,
        game_id: round.gameId,
      };
      roundChange(io, data2, null);
    }
  }, 1000);
}





async function quitGame(obj, socket, io) {
  io.to(obj.game_id).emit("PLAYERQUIT", { status: 200, dice: obj });
  await leavetheGame(obj.game_id, obj._id, socket, 1, io);
}

async function leavetheGame(gameId, userId, socket, quit, io) {
  let gameplay = await GamePlay.findOne({ game_id: gameId });
  let room = await Room.findById(gameId);
  let user = await User.findById(userId);

  //   if (room.no_of_players != round.winnerPos) {
  //       user.coins = user.coins + ((room.no_of_players - round.winnerPos + 1) * user.bet);
  //   }
  if (gameplay && room) {
    user.bet = 0;

    console.log("ROOM    dd" + room.name + "   " + gameId);

    if (!Array.isArray(room.players_joined)) {
      room.players_joined = [];
    }
    room.players_joined.pop(user);

    //    if (!Array.isArray(round.players)) {
    //      round.players = [];
    //   }
    //   round.players.pop(user);
    user.game_id = null;
    user.room_id = null;

    //  round.save();
    //  room.save();
    user.save();

    socket.leave(gameId);
    //if (quit == 1) {
    //   if (room.players_joined.length == 1) {
    //       await endGame(gameId, io);
    //   round.winnerId = round.players[0];
    //  round.winnerPos = round.winnerPos + 1;
    //      io.to(gameId).emit("ROUNDTURN", { status: 200, room });
    //   }
    // }
    // else

    if (room.players_joined.length == 1) {
      for (let i = 0; i < gameplay.users_data.length; i++) {

        if (userId != gameplay.users_data[i]._id) {
          gameplay.winnerId = gameplay.users_data[i]._id;
        }
      }
      //  gameplay.winnerId = room.players_joined[0]._id;


      await gameplay.save();
      io.to(room._id).emit("GAMEEND", { status: 200, gameplay: gameplay });
      await endGame(gameId, io);
    }
  }
}

async function endGame(gameId, io) {
  let gamePlay = await GamePlay.findOne({ game_id: gameId });
  // if (!Array.isArray(round.players)) {
  //     round.players = [];
  //  }
  for (let i = 0; i < gamePlay.users_data.length; i++) {
    let user = await User.findById(gamePlay.users_data[i]._id);
    if (gamePlay.winnerId == gamePlay.users_data[i]._id) {
      user.wins = user.wins + 1;
    }
    user.game_id = null;
    user.room_id = null;
    user.save();
  }
  console.log("game ends");
  //  await Round.deleteOne({ gameId: gameId });
  await Room.deleteOne({ _id: gameId });
  await GamePlay.deleteOne({ game_id: gameId });

  io.of("/")
    .in(gameId)
    .clients((err, clients) => {
      console.log(clients.length);
      clients.forEach((clientId) =>
        io.sockets.connected[clientId].disconnect()
      );
      console.log(clients.length);
    });
}

async function useTimerPack(obj, cb) {
  let user = await User.findById(obj.id);
  if (user) {
    if (user.timerPacks > 0) {
      user.timerPacks -= 1;
      await user.save();
      cb({
        status: 200,
        timerPacks: user.timerPacks
      })
    }

  }
}


async function addTimerPack(obj, cb) {
  let user = await User.findById(obj.id);
  if (user) {
    user.timerPacks += 10;
    await user.save();
    cb({
      status: 200,
      timerPacks: user.timerPacks
    })

  }
}

async function addPlayerPegs(obj, cb) {
  let gameplay = await GamePlay.findOne({ game_id: obj.room_id });
  if (gameplay) {
    let room = new Room();
    room = await Room.findOne({ _id: obj.room_id });
    if (room) {
      let user = await User.findOne({ _id: obj.user_id });
      gameplay.users_data.push(user);

      let user2 = room.players_joined[1];
      gameplay.current_Color = user2._id;
      gameplay.round = 1;
      gameplay.time = 240;
    }

    gameplay.save();
    if (cb) {
      cb({
        status: 200,
        message: "Turn Decided",
        objectToSend: gameplay,
      });
    }
  } else {
    let gamePlay2 = new GamePlay();
    gamePlay2.game_id = obj.room_id;
    if (!Array.isArray(gamePlay2.users_data)) {
      gamePlay2.users_data = [];
    }
    let room = new Room();
    room = await Room.findOne({ _id: obj.room_id });
    if (room) {
      let user = await User.findOne({ _id: obj.user_id });
      gamePlay2.users_data.push(user);
    }

    gamePlay2.save();
    if (cb) {
      cb({
        status: 200,
        message: "Turn Decided 2",
        objectToSend: gamePlay2,
      });
    }
  }
}
