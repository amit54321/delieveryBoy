const mongoose = require('mongoose');

const schema = mongoose.Schema({
    
   taskDone: {
        type: Array,
        required: false,
        default: []
    },
    id: {
        type: String,
        required: false,
        default: ""
    },
    
 
});

schema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('TaskDOne', schema);