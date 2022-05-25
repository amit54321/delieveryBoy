const db = require("../_helpers/db");
const io = require("../index");
const board = require("../gameplay/board");
//var schedule = require('node-schedule');
const mongoose = require("mongoose");
const { Round, PegsData } = require("../_helpers/db");
const User = db.User;
const Room = db.Room;
const GamePlay = db.GamePlay;
const TaskDone = db.TaskDone;
const gameplayService = require("../gameplay/gamePlay.service");
module.exports = {
  createRoom,
  checkRoom,
  joinRoom,
  leaveRoom,
  lookForPublicRoom,
  checkGame,
  chat,
  setCoin,
  resetCoinsByAds,
  resetCoinsById
};

async function chat(obj, socket, io, cb) {
  let room = await Room.findById(obj.gameId);
    //console.log("pop user dffddf " +obj.gameId)
  if (room) {
   // console.log("pop user gameIdFind " +obj.gameId)
    io.to(room._id).emit("CHATCALLBACK", { chat: obj });
  }
}

async function leaveRoom(obj, socket, io, cb) {
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  if (user.room_id == null) {
    cb({
      status: 400,
      message: "You are not connected to any room",
    });
  } else {
    if (user.room_id == obj.room_id) {
      let room = await Room.findById(obj.room_id);
      if (room) {
        if (!Array.isArray(room.players_joined)) {
          room.players_joined = [];
        }
        room.players_joined.pop(user);
        user.room_id = null;

        room.save();
        user.save();
        io.to(room._id).emit("ONROOMLEFT", { status: 200, room });

        cb({
          status: 200,
          message: "You have left the room",
          room: room,
        });
        console.log("pop user dffddf " + room.players_joined);
        socket.leave(room._id);
      }
    }
  }
}

async function createRoom(obj, socket, io, cb) {
  console.log("create room" + { obj });
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  if (user.room_id == null) {
    let room = new Room();
    room.no_of_players = obj.numberOfPlayers;
    room.status = 0;
    room.name = obj.roomName;
   // user.bet = obj.bet;
    room.bet = obj.bet;
    room._public = obj._public;
    room.code = Math.floor(Math.random() * 999999) + 100000;
    let time = obj.time;
    if (!time) {
      time = 1800000;
    }
    if (!Array.isArray(room.players_joined)) {
      room.players_joined = [];
    }
    room.end_time = Date.now() + time;
    room.players_joined.push(user);
    let room_res = await room.save();
    user.room_id = room_res._id;
    user.save();
    socket.join(room_res._id);
    let timeLeft = room.end_time - Date.now();
    cb({
      status: 200,
      message: "You are Connected",
      room: room_res,
      timeLeft: timeLeft,
    });

    ///CREATE A SCHEDULER HERE
    setTimeout(async () => {
      let tempRoom = await Room.findById(room._id);
      if (tempRoom) {
        let gameplay = await GamePlay.findOne({ game_id: tempRoom._id });
        if (!gameplay) {
          if (tempRoom._public == 1 && tempRoom.players_joined.length > 0) {
            makeAI(tempRoom, io,socket);

            return;
          }
          io.to(tempRoom._id).emit("ROOMCANCEL", { status: 200, tempRoom });
          console.log("gameplay delete");

          if (tempRoom) {
            console.log("players" + tempRoom.players_joined.length);
            for (let i = 0; i < tempRoom.players_joined.length; i++) {
              mongoose.set("useFindAndModify", false);
              User.findByIdAndUpdate(
                tempRoom.players_joined[i]._id,
                { $set: { room_id: null } },
                { new: true },
                function (err, doc) {
                  if (err) {
                    throw err;
                  } else {
                    console.log("Updated");
                  }
                }
              );
              socket.leave(tempRoom._id);
            }
            await Room.findByIdAndDelete(tempRoom._id)
              .then(function () {
                console.log("Data deleted"); // Success
              })
              .catch(function (error) {
                console.log(error); // Failure
              });
          }
        }
      }
    }, time);
  } else {
    let room_already_connected = await Room.findById(user.room_id);
    cb({
      status: 400,
      message: "You are Connected to a room",
      room: room_already_connected,
    });
  }
}
async function makeAI(room, io,socket) {
  let playersRequired = room.no_of_players - room.players_joined.length;
  console.log("Players  " + playersRequired);
  for (let i = 0; i < playersRequired; i++) {
    let user = await User.findOne({
      $and: [{ game_id: null }, { role: "ai" }, { room_id: null }],
    });
    
    if (!user) {
      user = await createAiUser();
    }
    if (!Array.isArray(room.players_joined)) {
      room.players_joined = [];
    }
   
    user.room_id = room._id;
    room.players_joined.push(user);
    user.save();
    mongoose.set("useFindAndModify", false);
    Room.findByIdAndUpdate(
      room._id,
      { $set: { players_joined: room.players_joined } },
      { new: true },
      function (err, doc) {
        if (err) {
          throw err;
        } else {
          console.log("Updated");
        }
      }
    );
    let timeLeft = room.end_time - Date.now();
    io.to(room._id).emit("ONROOMJOINED", {
      timeLeft: timeLeft,
      status: 200,
      room,
    });
  }
  if (room.no_of_players === room.players_joined.length) {
    Room.findByIdAndUpdate(
      room._id,
      { $set: { status: 1 } },
      { new: true },
      function (err, doc) {
        if (err) {
          throw err;
        } else {
          console.log("Updated");
        }
      }
    );
  
   
    let gameplay = new GamePlay();
    gameplay.time = 152;
    gameplay.game_id = room._id;
    gameplay.ai = 1;
    if (!Array.isArray(gameplay.tasksDone)) {
      gameplay.tasksDone = [];
    }
    if (!Array.isArray(gameplay.users_data)) {
      gameplay.users_data = [];
    }
    gameplay.round = 1;
    let aiUser =0;
    for (let i = 0; i < room.players_joined.length; i++) {

      gameplay.users_data.push(room.players_joined[i]);
      let user =  await  User.findById(room.players_joined[i]._id);
      user.game_id = gameplay.game_id ;
      if(user.role=="ai")
      {
        aiUser =user._id;
      }
      user.matches = user.matches+1;
       user.save();
   
      let  tasksData = new TaskDone();
      if (!Array.isArray( tasksData.taskDone)) {
        tasksData.taskDone = [];
      }
      tasksData.id =room.players_joined[i]._id;
     gameplay.tasksDone.push(tasksData);
    }
    gameplay.save();
    setTimeout(async () => {
      if (gameplay) {
        await resetCoins(room);
        console.log("gameplay calls");
        if (!Array.isArray( gameplay.tasks)) {
          gameplay.tasks = [];
        }
        for(let i=1;i<=10;i++)
        {
          let p = new PegsData();
          p.id=i;
          p.restaurantId =Math.floor(Math.random() * (10 - 1 + 1) + 1);
          p.customerId=Math.floor(Math.random() * (10 - 1 + 1) + 1);
          gameplay.tasks.push(p);
        
        } 
        gameplay.markModified("tasks");
        gameplay.save();
        io.to(room._id).emit("STARTGAME", { status: 200, gameplay: gameplay });
        for (let i = 0; i < room.players_joined.length; i++) {

          playGameMission(room.players_joined[i]._id,socket);
        }
        console.log("ai calls " + aiUser);
           if(aiUser!=0)
           {
             let last =0;
          for(let i=1;i<=10;i++)
            {
             let t = last +  (Math.floor(Math.random() * (20 - 1 + 1) + 10)) *1000;
             last =t;
             console.log("ai calls 2" + last);
             console.log("ai calls 2" + t);
            setTimeout(async () => {
              let data = {
              id :aiUser,
              taskId : i,
              game_id : gameplay.game_id
              }
              await gameplayService.taskDone(io,data);

            }, t);
          }
        }
      
      } else {
      }
    }, 2000);
    ///STRT GAME HERE
  }
}

async function createAiUser() {
  let user = new User();
  user.email = "Guest" + new Date().toISOString() + "@gmail.com";
  user.password = "12345446";
  user.name =
    board["aiplayers"][
      Math.floor(Math.random() * (board["aiplayers"].length - 1)) + 0
    ];
  user.is_online = 1;
  user.role = "ai";
  user.coins= 1000;
  user.avatar =  (Math.floor(Math.random() * 4) + 0).toString();
  user.token = "Guest" + new Date().toISOString();
  if (!Array.isArray( user.restaurants)) {
    user.restaurants = [];
  }
  for(let i=1;i<=10;i++)
  {

    let data2 = {      
      plot_id: i,
      restaurant_id:i,
      level:Math.floor(Math.random() * (10 - 1 + 1) + 1)
    };
    
    user.restaurants.push(data2);
    user.markModified("restaurants");
  } 
  console.log("player created " + user.name);
  ai_user = await user.save();
  return user;
}
async function setCoin(obj, socket, io, cb) {
  let gameplay = await GamePlay.findOne({ game_id: obj.gameId });
  if (gameplay) {
    if (obj.thiefId >= 0) {
      for (let i = 0; i < gameplay.collision.length; i++) {
        if (gameplay.collision[i].id == obj.id) {
          let user = await User.findById(obj.id);
          user.gold += 1;
          user.save();
          gameplay.collision[i].collision += 1;
          break;
        }
      }
      gameplay.markModified("collision");
      gameplay.save();
    }
    let b = Math.floor(Math.random() * 2) + 0;
    if (b == 1) {
      b = 2;
    }
    let setcoin = {
      a: Math.floor(Math.random() * 18) + 0,
      b: b,
    };
    io.to(obj.gameId).emit("SETCOIN", {
      setcoin,
      collision: gameplay.collision,
    });
  }
}
async function checkRoom(obj, socket, io, cb) {
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  if (user.room_id != null) {
    let room_already_connected = await Room.findOne({ _id: user.room_id });
    let timeLeft = room_already_connected.end_time - Date.now();
    let betsAmountMinimum = user.level * 100;
    let bets = [];
    socket.join(user.room_id._id);
    bets.push(betsAmountMinimum, betsAmountMinimum * 2, betsAmountMinimum * 3);
    cb({
      status: 400,
      message: "You are Connected to a room",
      room: room_already_connected,
      timeLeft: timeLeft,
      bets: bets,
    });
  } else {
    if (user.coins <= 0) {
      let s = "WatchAds";
      let descr = "You have not enough coins.Watch videos and earn coins";
      socket.emit("SHOWPOPUP", {
        name: s,
        desc: descr,
      });
    } else {
      cb({
        status: 200,
        message: "You are not Connected to any room",
      });
    }
  }
}

async function lookForPublicRoom(obj, socket, io, cb) {
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  if (user.room_id == null) {
    let roomLength = await Room.aggregate([
      {
        $match: {
          $and: [
            {
              status: 0,
            },
            {
              _public: 1,
            },
            {
              no_of_players: obj.numberOfPlayers,
            },
          ],
        },
      },
    ]);
    console.log("ROOM  " + roomLength.length);
    if (roomLength.length > 0) {
      let room = roomLength[0];
      if (!Array.isArray(room.players_joined)) {
        room.players_joined = [];
      }

      room.players_joined.push(user);
      user.room_id = room._id;
    //  user.bet = obj.bet;
      mongoose.set("useFindAndModify", false);
      Room.findByIdAndUpdate(
        room._id,
        { $set: { players_joined: room.players_joined } },
        { new: true },
        function (err, doc) {
          if (err) {
            throw err;
          } else {
            console.log("Updated");
          }
        }
      );
      console.log("JOINING THE ROOM  " + room._id);
      user.save();
      let timeLeft = room.end_time - Date.now();
      io.to(room._id).emit("ONROOMJOINED", {
        timeLeft: timeLeft,
        status: 200,
        room,
      });
      socket.join(room._id);
      cb({
        status: 200,
        message: "You have joined the room",
        room: room,
      });
      if (room.no_of_players === room.players_joined.length) {
        Room.findByIdAndUpdate(
          room._id,
          { $set: { status: 1 } },
          { new: true },
          function (err, doc) {
            if (err) {
              throw err;
            } else {
              console.log("Updated");
            }
          }
        );

      
        let gameplay = new GamePlay();
        gameplay.game_id = room._id;
       if (!Array.isArray(gameplay.tasksDone)) {
         gameplay.tasksDone = [];
        }
        if (!Array.isArray(gameplay.users_data)) {
          gameplay.users_data = [];
        }
      
        for (let i = 0; i < room.players_joined.length; i++) {
          gameplay.users_data.push(room.players_joined[i]);
          let user = await  User.findById(room.players_joined[i]._id);
          user.game_id = gameplay.game_id ;
          
          user.matches = user.matches+1;
           user.save();
       
           
          let  tasksData = new TaskDone();
          if (!Array.isArray( tasksData.taskDone)) {
            tasksData.taskDone = [];
          }
          tasksData.id =room.players_joined[i]._id;
          await gameplay.tasksDone.push(tasksData);
        }
        gameplay.save();
        setTimeout(async () => {
          if (gameplay) {
            await resetCoins(room);
            console.log("gameplay calls");
            if (!Array.isArray( gameplay.tasks)) {
              gameplay.tasks = [];
            }
            for(let i=1;i<=10;i++)
            {
              let p = new PegsData();
              p.id=i;
              p.restaurantId =Math.floor(Math.random() * (10 - 1 + 1) + 1);
              p.customerId=Math.floor(Math.random() * (10 - 1 + 1) + 1);
              gameplay.tasks.push(p);
             
            } 
            gameplay.markModified("tasks");
            await  gameplay.save();
            console.log("ai startGame  calls " + aiUser);
            io.to(room._id).emit("STARTGAME", {
              status: 200,
              gameplay: gameplay,
            });
          //   gameplay.save();
          for (let i = 0; i < room.players_joined.length; i++) {
            playGameMission(room.players_joined[i]._id,socket);
          
          
          }
          } else {
          }
        }, 3000);
        ///STRT GAME HERE
      }
    } else {
      await createRoom(obj, socket, io, cb);
    }
  }
}

async function checkGame(obj, socket, io, cb) {
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  if (user) {
    if (user.game_id != null) {
      let gamePlay = await GamePlay.findOne({ game_id: user.game_id });
      if (gamePlay) {
        socket.join(user.game_id);
        socket.emit("STARTGAME", { status: 200, gameplay: gamePlay });
      }
    }
  }
}

async function  playGameMission(id,socket)
{
  let obj = {      
    
  };
  setTimeout(async () => {
    gameplayService.missionDone(id,0, obj, socket);
    setTimeout(async () => { 
      gameplayService. missionDone(id,1, obj, socket);
     setTimeout(async () => { 
      gameplayService.missionDone(id,2, obj, socket);
     
      
      },  600); 
    },  600); 
   },  600); 
}

async function joinRoom(obj, socket, io, cb) {
  let user = await User.findById(mongoose.Types.ObjectId(obj._id));
  if (user.room_id == null) {
    let room = await Room.findOne({ code: obj.roomCode });
    if (room) {
      if (room.status == 0) {
        if (!Array.isArray(room.players_joined)) {
          room.players_joined = [];
        }
        room.players_joined.push(user);
        room = await room.save();
        user.room_id = room._id;
      //  user.bet = obj.bet;
        user.save();
        let timeLeft = room.end_time - Date.now();
        io.to(room._id).emit("ONROOMJOINED", {
          timeLeft: timeLeft,
          status: 200,
          room,
        });
        socket.join(room._id);
        cb({
          status: 200,
          message: "You have joined the room",
          room: room,
          timeLeft: timeLeft,
        });
        if (room.no_of_players === room.players_joined.length) {
          Room.findByIdAndUpdate(
            room._id,
            { $set: { status: 1 } },
            { new: true },
            function (err, doc) {
              if (err) {
                throw err;
              } else {
                console.log("Updated");
              }
            }
          );
        
          let gameplay = new GamePlay();
          gameplay.game_id = room._id;
          if (!Array.isArray(gameplay.tasksDone)) {
            gameplay.tasksDone = [];
          }
          if (!Array.isArray(gameplay.users_data)) {
            gameplay.users_data = [];
          }
      
          for (let i = 0; i < room.players_joined.length; i++) {

            gameplay.users_data.push(room.players_joined[i]);

            let user =   await User.findById(room.players_joined[i]._id);
            user.game_id = gameplay.game_id ;
            user.matches = user.matches+1;
             user.save();
     
             
            let  tasksData = new TaskDone();
            if (!Array.isArray( tasksData.taskDone)) {
              tasksData.taskDone = [];
            }
            tasksData.id =room.players_joined[i]._id;
           
            gameplay.tasksDone.push(tasksData);
          }
       
          gameplay.save();

          setTimeout(async () => {
            if (gameplay) {
              await resetCoins(room);
              console.log("gameplay calls");
              if (!Array.isArray( gameplay.tasks)) {
                gameplay.tasks = [];
              }
              for(let i=1;i<=10;i++)
              {
                let p = new PegsData();
                p.id=i;
                p.restaurantId =Math.floor(Math.random() * (10 - 1 + 1) + 1);
                p.customerId=Math.floor(Math.random() * (10 - 1 + 1) + 1);
                gameplay.tasks.push(p);
               
              } 
              gameplay.markModified("tasks");
              gameplay.save();
              io.to(room._id).emit("STARTGAME", {
                status: 200,
                gameplay: gameplay,
              });
         
              for (let i = 0; i < room.players_joined.length; i++) {

                playGameMission(room.players_joined[i]._id,socket);
              
            }



            } else {
            }
          }, 2000);
          ///STRT GAME HERE
        }
      } else {
        cb({
          status: 400,
          message: "Room is Full",
        });
      }
    } else {
      cb({
        status: 400,
        message: "Room is not present",
      });
    }
  } else {
    let room_already_connected = await Room.findOne({ _id: user.room_id });
    cb({
      status: 400,
      message: "You are Connected to a room",
      room: room_already_connected,
    });
  }
}
async function resetCoins(room) {
  for (let i = 0; i < room.players_joined.length; i++) {
    User.findByIdAndUpdate(
      room.players_joined[i]._id,
      {
        $set: {
          coins: room.players_joined[i].coins - room.bet,
        },
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
}
async function resetCoinsById(id,coin) {
  
    User.findByIdAndUpdate(
     id,
      {
       
          $inc : { "coins" : coin } ,
        
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

async function resetCoinsByAds(obj, cb) {

  User.findByIdAndUpdate(
    obj._id,
    {
      $set: {
        coins: room.players_joined[i].coins - room.players_joined[i].bet,
      },
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
