var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userSchema = new Schema({
    firstName: {type: String, required: true, maxLength: 100},
    lastName: {type: String, required: true, maxLength: 100},
    email: {type: String, required: true, maxLength: 100, unique: true},
    username: {type: String, required: true, maxLength: 100, unique: true},
    passwordHash: {type: String, required: true},
    reputation: {type: Number, default: 100, required: true},
    isAdmin: {type: Boolean, default: false, required: true},
    createdDate: {type: Date, default: Date.now, required: true},
});

userSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Users', userSchema);