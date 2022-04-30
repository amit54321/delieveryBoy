const mongoose = require('mongoose');
const User = require('./user.model');

const expireTime = 900;

const verificationSchema = new mongoose.Schema({
    id: {
        type: String
    },
    code: {
        type: String,
    },
    expire_at: {
        type: Date,
        default: Date.now,
        expires: expireTime
    }
});


verificationSchema.statics.createVerification = async (newVerification, callback) => {
    await newVerification.save(callback);
}

verificationSchema.statics.validateCode = async (code, callback) => {
    const result = await Verification.findOne({ code });
    if (!result) {
        throw new Error('Invalid verification code or Code Expired!');
    }
    return await User.findById({ _id: new mongoose.Types.ObjectId(result.id) });
}

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;

