const mongoose = require('mongoose');

const schema = mongoose.Schema({
    game_id: {
        type: String,
        required: true,
        trim: true
    },
   tasksDone: {
        type: Array,
        required: false,
        default: []
    },
    tasks: {
        type: Array,
        required: false,
        default: []
    },
    users_data: {
        type: Array,
        required: false,
        default: []
    },
    
    winnerId: {
        type: String,
        required: false,
        default: ""
    },
    round: {
        type: Number,
        required: false,
        default: 1
    },
    ai: {
        type: Number,
        required: false,
        default: 0
    },
    time: {
        type: Number,
        required: false,
        default: 0
    },
});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('GamePlay', schema);