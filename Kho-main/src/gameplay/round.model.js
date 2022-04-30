const mongoose = require('mongoose');

const schema = mongoose.Schema({
    gameId: {
        type: String,
        required: true,
        trim: true
    },
    turnId: {
        type: String,
        trim: true,
        required: false,
        default: ""
    },
    diceNumber: {
        type: Number,
        required: false,
        default: 0
    },
    players: {
        type: Array,
        required: false,
        default: []
    },
    turn: {
        type: Number,
        required: false,
        default: 0
    },


    pegsToKill: {
        type: Array,
        required: false,
        default: []
    },
    pegId: {
        type: Number,
        required: false,
        default: 0
    },
    pegPosition: {
        type: Number,
        required: false,
        default: -1
    },

    pegsCanMove: {
        type: Array,
        required: false,
        default: []
    },
    pegMoveTurn: {
        type: String,
        required: false,
        trim: true
    },
    winnerId: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    winnerPos: {
        type: Number,
        required: false,
        default: 0
    },

    coins: {
        type: Number,
        required: false,
        default: -1
    },
});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Round', schema);