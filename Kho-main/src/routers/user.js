const express = require("express");
const db = require("../_helpers/db");
const router = express.Router();
//const { customAlphabet } = require('nanoid');
//const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)
const { sendVerificationMail } = require("../email/mail");
const userPacks = require("../models/userpacks.service");
const validator = require("validator");
const { ResumeToken } = require("mongodb");
const User = db.User;
const UserPacks = db.UserPacks;
const Verification = require("../models/verification.modal");

router.post("/users/setScore", async (req, res) => {
  let user = await User.findById(req.body.id);
  let leaderBoard = await Leaderboard.findOne({ name: req.body.name });
  if (user) {
    if (leaderBoard) {
      if (!Array.isArray(leaderBoard.leaderBoard)) {
        leaderBoard.leaderBoard = [];
      }
      let found = false;
      for (let i = 0; i < leaderBoard.length; i++) {
        if (leaderBoard.leaderBoard.id == req.body.id) {
          found = true;
          break;
        }
      }
      if (!found) {
        let data = { id: req.body.id, score: req.body.score, name: user.name };
        leaderBoard.leaderBoard.push(data);
        leaderBoard.leaderBoard.sort(compareScore);
        await leaderBoard.save();
      }
    } else {
      let leaderboard = new Leaderboard();
      leaderboard.name = req.body.name;
      let data = { id: req.body.id, score: req.body.score, name: user.name };
      leaderBoard.leaderBoard.push(data);
      leaderBoard.leaderBoard.sort(compareScore);
      await leaderBoard.save();
    }
  }
});
function compareScore(a, b) {
  return a.score - b.score;
}
//var jwt = require('jsonwebtoken');
//var bcrypt = require('bcryptjs');
//var config = require('../config');

router.post("/users/getLeaderBoard", async (req, res) => {
  let leaderBoard = await Leaderboard.findOne({ name: req.body.name });
  if (leaderBoard) {
    res.status(200).send({
      message: leaderBoard,
      status: 200,
    });
  }
});

router.post("/users/register", async (req, res) => {
  let user = await User.findOne({ deviceId: req.body.deviceId });

  if (user) {
    user.deviceId = req.body.deviceId;
    await user.save();
    let allMissions = await userPacks.sendAllMissionsJson(user._id);

    if (!allMissions) {
      allMissions = await userPacks.addInitialChatsAndMissions(user._id);
    } else {
    }
    res.status(200).send({
      message: user,
      status: 200,
      missions: allMissions,
    });
  } else {
    let user = new User();

    user.token = user._id;

    // const secret = config.secret;
    // save user token
    // user.token = secret;
    user.deviceId = req.body.deviceId;
    await user.save();
    let allMissions = await userPacks.sendAllMissionsJson(user._id);

    if (!allMissions) {
      allMissions = await userPacks.addInitialChatsAndMissions(user._id);
    }

    res.status(200).send({
      message: user,
      status: 200,
      missions: allMissions,
    });
  }
});
router.post("/users/updateCoins", async (req, res) => {
  let user = await User.findById(req.body.id);
  user.coins += req.body.coins;
  await user.save();

  res.status(200).send({
    message: user,
    status: 200,
  });
});

router.post("/users/update", async (req, res) => {
  console.log("game ends  " + req.body.deviceId);
  let user = await User.findOne({ deviceId: req.body.deviceId });
  if (user) {
    user.name = req.body.name;
    user.avatar = req.body.avatar;
    await user.save();
    let allMissions = await userPacks.sendAllMissionsJson(user._id);
    res.status(200).send({
      message: user,
      status: 200,
      missions: allMissions,
    });
  } else {
    let user = new User();
    user.deviceId = req.body.deviceId;
    await user.save();
    let allMissions = await userPacks.addInitialChatsAndMissions(user._id);

    res.status(200).send({
      message: user,
      status: 200,

      missions: allMissions,
    });
  }
});

router.post("/users/login", async (req, res) => {
  try {
    let allChatPAcks = await userPacks.sendAllChatJson();
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    let allMissions = await userPacks.sendAllMissionsJson(user._id);
    res.send({
      status: 200,
      message: user,
      chatPacks: allChatPAcks,
      missions: allMissions,
    });
  } catch (e) {
    res.status(400).send({ status: 400, error: e.message });
  }
});

router.post("/users/tutorialStep", async (req, res) => {
  try {
    let user = await User.findById(req.body.id);
    user.tutorial = 1;
    await user.save();
    console.log("TUTORIAL FINISHED");
    res.status(200).send({ status: 200, message: user });
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});
router.post("/users/minimumData", async (req, res) => {
  try {
    let user = await User.findById(req.body.id);
    if (user) {
      let d = {
        coins: user.coins,
        matches: user.matches,
        wins: user.wins,
        avatar: user.avatar,
        name: user.name,
        delievery: delievery,
      };
      res.send({ status: 200, message: d });
    }
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});

router.post("/users/data", async (req, res) => {
  try {
    let user = await User.findById(req.body.id);
    res.send({ status: 200, message: user });
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});

router.post("/users/screen", async (req, res) => {
  try {
    let user = await User.findById(req.body.id);
    user.screen = req.body.screen;
    await user.save();
    res.send({ status: 200, message: user });
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});

router.post("/users/watchads", async (req, res) => {
  try {
    let user = await User.findById(req.body.id);
    user.coins = user.coins + 100;
    console.log("user " + user.coins);
    user.save();
    res.send({ status: 200, message: user });
  } catch (e) {
    io.to(user._id).emit("UPDATEDUSER", { status: 200, message: user });
  }
});

router.post("/reset", async (req, res) => {
  try {
    await User.resetPassword(
      req.body.id,
      req.body.oldPassword,
      req.body.newPassword
    );
    res
      .status(200)
      .send({ status: 200, message: "Password changed successfully." });
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});

router.post("/forgot", async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res
      .status(400)
      .send({ status: 400, message: "Please provide an email" });
  }
  if (!validator.isEmail(email)) {
    return res
      .status(400)
      .send({ status: 400, message: "Please provide a valid email" });
  }
  const verificationCode = nanoid();
  const newVerification = new Verification({
    id: req.body.id,
    code: verificationCode,
  });
  await Verification.createVerification(newVerification, (err, result) => {
    sendVerificationMail(req.body.email, result.code);
    res.send(result);
  });
});

router.post("/forgot/:code", async (req, res) => {
  try {
    const user = await Verification.validateCode(req.params.code);
    res.send(user); // VERIFICATION CODE MATCHED!!!
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});

router.post("/forgot/new/password", async (req, res) => {
  try {
    await User.forgotNewPassword(req.body.id, req.body.newpassword);
    res
      .status(200)
      .send({ status: 200, message: "Password changed successfully." });
  } catch (e) {
    res.status(400).send({ status: 400, message: e.message });
  }
});
router.post("/users/addcoins", async (req, res) => {
  let user = await User.findById(req.body.id);
  user.coins = user.coins + req.body.coins;

  await user.save();
  console.log("user " + user.coins);

  res.send({
    status: 200,
    message: user,
  });
});

router.post("/users/dailyreward", async (req, res) => {
  try {
    let userPacks = await UserPacks.findOne({ id: req.body.id });
    let user = await User.findById(req.body.id);
    user.coins = user.coins + user.level * 100;
    userPacks.dailyReward = 1;
    userPacks.save();
    console.log("user " + user.coins);
    user.save();
    res.send({
      status: 200,
      message: user,
    });
  } catch (e) {
    res.status(400).send({
      status: 400,
      message: e.message,
    });
  }
});

module.exports = router;
