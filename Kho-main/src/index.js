const express = require("express");
const app = express();
const path = require("path");
const bodyParser1 = require("body-parser");
app.use(bodyParser1.json({ limit: "50mb" }));
app.use(bodyParser1.urlencoded({ limit: "50mb", extended: true }));
const userRouter = require("./routers/user.js");
const analyticsRouter = require("./models/analytics.service.js");

var server2 = require("http").createServer(app);
var sio = require("socket.io").listen(server2); // it was require('socket.io')(server);

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(userRouter);
app.use(analyticsRouter);

var cron = require("node-cron");
const server = server2.listen(port, () => {
  // resetAll();
  console.log(`Server is running on port ${port}`);
});

let a = 0;
async function resetAll() {
  let task = cron.schedule("1-5 * * * *", () => {
    a += 1;
    console.log("running a task every minute " + a);
  });
  task.start();
}

///SOCKET

//const sio = io.listen(server2);

let socket_connect = require("./_helpers/socket");

socket_connect(sio);

module.exports.io = sio;

//module.exports.transporter = transporter;
