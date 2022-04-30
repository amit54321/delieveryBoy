const mongoose = require('mongoose');

const schema = mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    analytic_events: {
        type: Array,
        required: false,
        default: []
    },
   
   


});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Analytics', schema);