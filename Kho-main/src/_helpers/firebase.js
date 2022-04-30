const firebase = require("firebase-admin");
const config = require('config.json');
const serviceAccount = require('colormirror-7073c-firebase-adminsdk-9oixg-1ba9b8d67c.json');



//console.log({serviceAccount});


firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://colormirror-7073c.firebaseio.com"
  });


  /**
   * 
   * @param {*} firebaseToken 
   * @param {*} payload 
   * 
   *     
   * 
   */
  async function sendNotification(firebaseToken,payload){

    // const payload = {
    //     notification: {
    //       title: 'Notification Title',
    //       body: 'This is an example notification',
    //     }
    //   };

    payload["token"]=firebaseToken;
    console.log({payload});

    const options = {
        priority: 'high',
        timeToLive: 60 * 60 * 24, // 1 day
      };
    // firebase.
    // messaging().
    // sendToDevice(firebaseToken, payload, options);

    firebase
    .messaging().send(payload)
    .then(res=>{
        console.log("Successfully notification send",res);
    }).catch(err=>{
       console.log("Successfully notification send",err);
    });


  }


  module.exports ={
    sendNotification
  };