// Post Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    title: {type: String, required: true, maxLength: 100},
    content: {type: String, required: true},
    linkFlairID: {type: Schema.Types.ObjectId, ref: 'Linkflairs'},
    postedBy: {type: Schema.Types.ObjectId, ref: 'Users', required: true},
    postedDate: {type: Date, required: true, default: Date.now},
    commentIDs: {type: [Schema.Types.ObjectId], ref: 'Comments'},
    views: {type: Number, default: 0, required: true},
    votes: {type: Number, default: 0, required: true},
});

postSchema.virtual('url').get(function() {
    return `posts/${this._id}`;
});

postSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Posts', postSchema)