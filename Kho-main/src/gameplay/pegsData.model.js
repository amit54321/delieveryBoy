const mongoose = require('mongoose');

const schema = mongoose.Schema({
    id: {
        type: Number,
        required: true,
        trim: true
    },
   
    restaurantId: {
        type: Number,
        required: false,
        default: -1
    },
    customerId: {
        type: Number,
        required: false,
        default: -1
    }
    


});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('PegsData', schema);