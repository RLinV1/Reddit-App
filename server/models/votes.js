var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var voteSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    post: {type: Schema.Types.ObjectId, ref: 'Posts', default: null},
    comment: {type: Schema.Types.ObjectId, ref: 'Comments', default: null},
    vote: {type: Number, enum: [1, -1], required: true}
});

voteSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Votes', voteSchema);