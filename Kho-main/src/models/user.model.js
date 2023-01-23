const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    default: "",
  },

  deviceId: {
    type: String,
    trim: true,
    required: false,

    lowercase: true,
  },

  token: {
    type: String,
  },
  avatar: {
    type: String,
    default:
      "https://e7.pngegg.com/pngimages/163/442/png-clipart-computer-icons-user-profile-icon-design-avatar-face-heroes.png",
  },

  is_online: {
    type: Number,
    required: false,
    default: 0,
  },
  socket_id: {
    type: String,
    required: false,
    default: 0,
  },
  room_id: {
    type: String,
    required: false,
    default: null,
  },
  game_id: {
    type: String,
    required: false,
    default: null,
  },
  role: {
    type: String,
    required: false,
    default: "user",
  },
  coins: {
    type: Number,
    required: true,
    default: 2500,
  },

  restaurants: {
    type: Array,
    required: false,
    default: [],
  },

  timers: {
    type: Array,
    required: false,
    default: [],
  },
  timerId: {
    type: Number,
    required: false,
    default: 0,
  },

  tutorial: {
    type: Number,
    required: false,
    default: 0,
  },
  step: {
    type: Number,
    required: false,
    default: 0,
  },
  matches: {
    type: Number,
    required: false,
    default: 0,
  },
  timerPacks: {
    type: Number,
    required: false,
    default: 0,
  },
  wins: {
    type: Number,
    required: false,
    default: 0,
  },
  delievery: {
    type: Number,
    required: false,
    default: 0,
  },
  screen: {
    type: String,
    required: false,
    default: "user",
  },
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "thisismysecret");
  user.token = token;
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

userSchema.statics.resetPassword = async (id, oldPassword, newPassword) => {
  const user = await User.findById({ _id: id });
  if (!user) {
    throw new Error("Unable to reset the password");
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Passwords don't match");
  } else {
    user.password = newPassword;
    await user.save();
  }
  return user;
};

userSchema.statics.forgotNewPassword = async (id, newPassword) => {
  const user = await User.findById({ _id: id });
  if (!user) {
    throw new Error("Unable to update the password");
  }
  user.password = newPassword;
  await user.save();
  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
