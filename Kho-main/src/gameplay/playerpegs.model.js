const mongoose = require('mongoose');

const schema = mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    pegs_data: {
        type: Array,
        required: false,
        default: 0
    },
    color: {
        type: Number,
        required: false,
        default: 0
    },
    turn: {
        type: Number,
        required: false,
        default: 0
    }
   

});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('PlayerPegs', schema);