/* server/init.js
** You must write a script that will create documents in your database according
** to the datamodel you have defined for the application.  Remember that you 
** must at least initialize an admin user account whose credentials are derived
** from command-line arguments passed to this script. But, you should also add
** some communities, posts, comments, and link-flairs to fill your application
** some initial content.  You can use the initializeDB.js script from PA03 as 
** inspiration, but you cannot just copy and paste it--you script has to do more
** to handle the addition of users to the data model.
*/
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const communitySchema = require('./models/communities');
const postSchema = require('./models/posts');
const commentSchema = require('./models/comments');
const linkSchema = require('./models/linkflairs');
const userSchema = require('./models/users');
const voteSchema = require('./models/votes');


let userArgs = process.argv.slice(2);

if (userArgs.length < 6 || !userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
const [mongoDB, firstName, lastName, email, username, password] = userArgs;
mongoose.connect(mongoDB);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

function createLinkFlair(linkFlairObj) {
    let newLinkFlairDoc = new linkSchema({
        content: linkFlairObj.content,
    });
    return newLinkFlairDoc.save();
}

function createComment(commentObj) {
    let newCommentDoc = new commentSchema({
        content: commentObj.content,
        commentedBy: commentObj.commentedBy,
        commentedDate: commentObj.commentedDate,
        commentIDs: commentObj.commentIDs,
        votes: commentObj.votes,
        postID: commentObj.postID
    });
    return newCommentDoc.save();
}

function createPost(postObj) {
    let newPostDoc = new postSchema({
        title: postObj.title,
        content: postObj.content,
        postedBy: postObj.postedBy,
        postedDate: postObj.postedDate,
        views: postObj.views,
        linkFlairID: postObj.linkFlairID,
        commentIDs: postObj.commentIDs,
        votes: postObj.votes,
    });
    return newPostDoc.save();
}

function createCommunity(communityObj) {
    let newCommunityDoc = new communitySchema({
        name: communityObj.name,
        description: communityObj.description,
        postIDs: communityObj.postIDs,
        startDate: communityObj.startDate,
        members: communityObj.members,
        createdBy: communityObj.createdBy,
    });
    return newCommunityDoc.save();
}

async function createUser(userObj, isAdmin = false, customReputation = 100) {
    let saltRounds = 10;
    let salt = await bcrypt.genSalt(saltRounds);
    let pwHash = await bcrypt.hash(userObj.password, salt);
    
    let newUserDoc = new userSchema({
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        username: userObj.username,
        passwordHash: pwHash,
        reputation: isAdmin ? 1000 : customReputation, 
        isAdmin,
        createdDate: userObj.createdDate || new Date(),
    });
    return newUserDoc.save();
}

function createVote(voteObj) {
    let newVoteDoc = new voteSchema({
        user: voteObj.user,
        post: voteObj.post,
        comment: voteObj.comment,
        vote: voteObj.vote
    });
    return newVoteDoc.save();
}



async function main() {

    await createUser({
        firstName,
        lastName,
        email,
        username,
        password,
    }, true)
    const user1 = await createUser({
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@gmail.com",
        username: "bobsmith",
        password: "123456",
        createdDate: new Date('January 1, 2021 12:00:00'),
    }, false, 110)
    const user2 = await createUser({
        firstName: "Dad",
        lastName: "Smith",
        email: "dad@gmail.com",
        username: "dadsmith",
        password: "ilovecowzs",
        createdDate: new Date('January 1, 2025 12:00:00'),
    }, false, 105)
    const user3 = await createUser({
        firstName: "car",
        lastName: "dave",
        email: "cd@gmail.com",
        username: "cd23",
        password: "urbanpro",
        createdDate: new Date('January 1, 2023 12:00:00'),
    }, false, 90)
    await createUser({  // bad standing user
        firstName: "jack",
        lastName: "paul",
        email: "throwaway@gmail.com",
        username: "badstanding_user",
        password: "iambad123",
        createdDate: new Date('January 1, 2023 12:00:00'),
    }, false, 10)

    const emailPrefix = email.split('@')[0];
    const loweredPassword = password.toLowerCase();
    const loweredFirstName = firstName.toLowerCase();
    const loweredLastName = lastName.toLowerCase();
    const loweredUsername = username.toLowerCase();
    const loweredEmailPrefix = emailPrefix.toLowerCase();

    if (loweredPassword.includes(loweredFirstName) || loweredPassword.includes(loweredLastName) || loweredPassword.includes(loweredUsername) || loweredPassword.includes(loweredEmailPrefix)) {
        return console.log("Password cannot contain first name, last name, username, or email prefix.");
    }


    // console.log(`Added admin user: ${admin}`);

    const linkFlair1 = { 
        content: 'Talk to your doctor', 
    };
    const linkFlair2 = { 
        content: 'How did he do he do that?',
    };
    const linkFlair3 = { 
        content: 'What a loser',
    };
    const linkFlair4 = { 
        content: 'I am a loser'
    }
    await createLinkFlair(linkFlair1);
    let linkFlairRef2 = await createLinkFlair(linkFlair2);
    let linkFlairRef3 = await createLinkFlair(linkFlair3);
    await createLinkFlair(linkFlair4);

    const post1 = {
        title: "TIFU by microwaving a fork",
        content: "So I got home drunk last night, craving leftover lasagna. It was cold, I was impatient, and I totally forgot the basic laws of physics. Threw the whole plate—fork and all—into the microwave. 30 seconds later I nearly recreated the Big Bang in my kitchen. Roommates are mad. Ceiling has burn marks. Worth it? Maybe.",
        linkFlairID: linkFlairRef2,
        postedBy: user1,
        postedDate: new Date('October 4, 2024 02:30:00'),
        commentIDs: [],
        views: 342,
        votes: 0,
    };
    
    const post2 = {
        title: "Ask Reddit: Why do cats always land on their feet?",
        content: "I dropped my sandwich and it hit the floor like a dead fish. My cat fell off the counter right after and landed like a gymnast. Why do cats have this magical aerial awareness? Are they secretly built different?",
        linkFlairID: linkFlairRef3,
        postedBy: user2,
        postedDate: new Date('April 11, 2025 16:47:00'),
        commentIDs: [],
        views: 789,
        votes: 1,
    };
    const post3 = {
        title: "Ask Reddit: Can arms regrow?",
        content: "Can my arms regrow back if I cut them off?",
        linkFlairID: linkFlairRef2,
        postedBy: user3,
        postedDate: new Date('August 12, 2024 16:47:00'),
        commentIDs: [],
        views: 789,
        votes: -1,
    };

    let postRef1 = await createPost(post1);
    let postRef2 = await createPost(post2);
    let postRef3 = await createPost(post3);

    const comment6 = { 
        content: 'No way!',
        commentIDs: [],
        commentedBy: user3,
        commentedDate: new Date('May 15, 2024 09:00:00'),
        votes: 0,
        postID: postRef1._id 
    };
    let commentRef6 = await createComment(comment6);

    const comment5 = { 
        content: 'That is so funny!',
        commentIDs: [],
        commentedBy: user1,
        commentedDate: new Date('April 21, 2025 10:00:00'),
        votes: 1,
        postID: postRef2._id 
    };
    let commentRef5 = await createComment(comment5);

    const comment4 = { 
        content: 'Are you serious?',
        commentIDs: [commentRef5],
        commentedBy: user1,
        commentedDate: new Date('April 20, 2025 09:00:00'),
        votes: 0,
        postID: postRef2._id 
    };
    let commentRef4 = await createComment(comment4);

    const comment3 = { 
        content: 'What are we talking about!',
        commentIDs: [],
        commentedBy: user3,
        commentedDate: new Date('March, 15, 2025 10:00:00'),
        votes: 0,
        postID: postRef2._id 
    };
    let commentRef3 = await createComment(comment3);

    const comment2 = { 
        content: 'I am a loser',
        commentIDs: [commentRef3, commentRef4],
        commentedBy: user1,
        commentedDate: new Date('February 2, 2025 08:22:00'),
        votes: 1,
        postID: postRef2._id 
    };
    let commentRef2 = await createComment(comment2);
    
    const comment1 = { 
        content: 'I hate you guyz',
        commentIDs: [commentRef2],
        commentedBy: user2,
        commentedDate: new Date('January 1, 2025 12:00:00'),
        votes: 0,
        postID: postRef2._id
    }
    let commentRef1 = await createComment(comment1);

    postRef1 = await postSchema.findByIdAndUpdate(postRef1._id, {
        $push: { commentIDs: { $each: [commentRef6._id] } }
    });

    postRef2 = await postSchema.findByIdAndUpdate(postRef2._id, {
        $push: { commentIDs: { $each: [commentRef2._id] } }
    });

    const community1 = {
        name: 'TIFU',
        description: 'Today I F***ed Up.',
        postIDs: [postRef1],
        startDate: new Date('August 10, 2014 04:18:00'),
        members: [user1, user2],
        memberCount: 2,
        createdBy: user1,
    };
    const community2 = {
        name: 'Ask Reddit',
        description: 'A way to ask Reddit.',
        postIDs: [postRef2, postRef3],
        startDate: new Date('May 4, 2017 08:32:00'),
        members: [user2, user3],
        memberCount: 2,
        createdBy: user3,
    };
    await createCommunity(community1);
    await createCommunity(community2);

    const vote1 = {
        user: user1,
        post: postRef1,
        vote: 1
    };
    const vote2 = {
        user: user2,
        post: postRef2,
        vote: -1
    };
    const vote3 = {
        user: user2,
        comment: commentRef1,
        vote: 1
    };
    const vote4 = {
        user: user1,
        comment: commentRef1,
        vote: 1
    };
    const vote5 = {
        user: user3,
        post: postRef2,
        vote: 1
    };
    const vote6 = {
        user: user3,
        comment: commentRef2,
        vote: 1
    };
    const vote7 = {
        user: user3,
        comment: commentRef5,
        vote: 1
    };
    const vote8 = {
        user: user3,
        post: postRef3,
        vote: -1
    };
    await createVote(vote1);
    await createVote(vote2);
    await createVote(vote3);
    await createVote(vote4);
    await createVote(vote5);
    await createVote(vote6);
    await createVote(vote7);
    await createVote(vote8);

    if (db) {
        db.close();
    }
    console.log("done");
}

main().then(() => {
    console.log("Database initialized successfully.");
    db.close();
}).catch((err) => {
    console.error("Error initializing database: ", err);
    db.close();
});

