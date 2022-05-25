const mongoose = require('mongoose');

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    no_of_players: {
        type: Number,
        required: false,
        default: 0
    },
    players_joined: {
        type: Array,
        required: false,
        default: []
    },
    status: {
        type: Number,
        required: false,
        default: 0
    },
    _public: {
        type: Number,
        required: false,
        default: 0
    },
    end_time: {
        type: Number,
        default: Date.now
    }
, 
     bet: {
    type: Number,
    default: 0
    }


});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Room', schema);