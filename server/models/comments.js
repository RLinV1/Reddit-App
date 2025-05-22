// Comment Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var commentSchema = new Schema ({
    content: {type: String, required: true, maxLength: 500},
    commentIDs: {type: [Schema.Types.ObjectID], ref: 'Comments'},
    commentedBy: {type: Schema.Types.ObjectId, ref: 'Users', required: true},
    commentedDate: {type: Date, required: true, default: Date.now},
    votes: {type: Number, default: 0, required: true},
    postID: { type: Schema.Types.ObjectId, ref: 'Posts', required: true}
});

commentSchema.virtual('url').get(function() {
    return `comments/${this._id}`;
});

commentSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Comments', commentSchema);