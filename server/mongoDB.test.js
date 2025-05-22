const axios = require('axios');
const mongoose = require('mongoose');
const {app} = require('./server');
const postSchema = require('./models/posts');
const commentSchema = require('./models/comments');
const userSchema = require('./models/users');

// jest.setTimeout(10000); 

let db;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb://127.0.0.1:27017/Phreddit', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
    db = mongoose.connection;
});

afterAll(async () => {
        await new Promise((r) => setTimeout(r, 1000));
        await db.dropDatabase();
        db.close();
        await mongoose.disconnect(); // Disconnect from the database
        app.closeServer()
});

describe('test deleting a post', () => {

    test('delete post from post model', async () => {
        let user = new userSchema({
            firstName: "johnny",
            lastName: "deep",
            email: "jd@gmail.com",
            username: "jd55",
            password: "urbanpro",
            passwordHash:"asdasd",
            createdDate: new Date('January 1, 2023 12:00:00'),
        });
        await user.save();

        let post = new postSchema({
            title: "TIFU by microwaving a spork",
            content: "So I got home drunk last night, craving leftover PASTA. It was cold, I was impatient, and I totally forgot the basic laws of physics. Threw the whole plate—fork and all—into the microwave. 30 seconds later I nearly recreated the Big Bang in my kitchen. Roommates are mad. Ceiling has burn marks. Worth it? Maybe.",
            postedBy: user,
            postedDate: new Date('October 4, 2024 02:30:00'),
            commentIDs: [],
            views: 342,
            votes: 5,
        });
        await post.save();

        let comment3 = new commentSchema({
            content: 'Wait... IM BEING HACKED',
            commentIDs: [],
            commentedBy: user,
            commentedDate: new Date('April 21, 2025 10:00:00'),
            votes: 20,
            postID: post
        });
        await comment3.save();

        let comment2 = new commentSchema({
            content: 'No I did not.',
            commentIDs: [],
            commentedBy: user,
            commentedDate: new Date('April 21, 2025 10:00:00'),
            votes: 20,
            postID: post
        });
        await comment2.save();

        let comment1 = new commentSchema({
            content: 'Yes you did.',
            commentIDs: [comment2],
            commentedBy: user,
            commentedDate: new Date('April 21, 2025 10:00:00'),
            votes: 20,
            postID: post
        });
        await comment1.save();

        await postSchema.findByIdAndUpdate(post._id, {
                $push: { commentIDs: comment1._id }
        });

        // const tempPost = await postSchema.findById(post._id);

        let commentList = [comment1, comment2, comment3];

        const response = await axios.delete(`http://localhost:8000/deletePost/${post._id}`);
        expect(response.status).toBe(200);
        const deletedPost = await postSchema.findById(post._id);
        // console.log(deletedPost);
        expect(deletedPost).toBe(null);
        for (let comment of commentList) {
            const deletedComment = await commentSchema.findById(comment._id);
            // console.log(deletedComment);
            expect(deletedComment).toBe(null);
        }
    });
});
 