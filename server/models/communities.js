// Community Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var communitySchema = new Schema ({
    name: {type: String, required: true, maxLength: 100, unique: true},
    description: {type: String, required: true, maxLength: 500},
    postIDs: {type: [Schema.Types.ObjectId], ref: 'Posts'},
    startDate: {type: Date, required: true, default: Date.now},
    members: [{ type: Schema.Types.ObjectId, ref: 'Users', required: true }],
    createdBy : { type: Schema.Types.ObjectId, ref: 'Users', required: true },
});

communitySchema.virtual('url').get(function() {
    return `communities/${this._id}`;
});

communitySchema.virtual('memberCount').get(function() {
    return this.members.length;
})

communitySchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Communities', communitySchema);