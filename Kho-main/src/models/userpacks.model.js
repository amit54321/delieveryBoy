const mongoose = require('mongoose');

const schema = mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    chatPacks: {
        type: Array,
        required: false,
        default: []
    },

   missions: {
        type: Array,
        required: false,
        default: []
    },
    dailyReward: {
        type: Number,
        required: false,
        default:false
    },

   


});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('UserPack', schema);