const express = require('express');
const db = require('../_helpers/db');
const router = express.Router();
const Analytics = db.Analytics;

router.post('/analytics', async (req, res) => {
    let user = await Analytics.findOne({ id: req.body.id });
    if (user) {
        if (!Array.isArray(user.analytic_events)) {
            user.analytic_events = [];
        }
        let data = {
            "eventName": req.body.eventName,
            "eventType": req.body.eventType,
            "createdAt": Date.now()
        };
        user.analytic_events.push(data);
        user.save();
    }
    else {
        let user = new Analytics();
        user.id = req.body.id;
        if (!Array.isArray(user.analytic_events)) {
            user.analytic_events = [];
        }
        let data = {
            "eventName": req.body.eventName,
            "eventType": req.body.eventType,
            "createdAt": Date.now()
        };
        console.log(user)
        user.analytic_events.push(data);
        user.save();
    }
    res.status(400).send({
        status: 400,
        message: user
    });
});




module.exports = router;