// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');  
const postSchema = require('./models/posts'); 
const communitySchema = require('./models/communities');
const commentSchema = require('./models/comments');
const linkSchema = require('./models/linkflairs');
const userSchema = require('./models/users'); // import user schema
const session = require('express-session'); // for session management
const MongoStore = require('connect-mongo'); //access to DB for session data
const bcrypt = require('bcrypt'); // for password hashing and verifcation
const voteSchema = require('./models/votes');


const saltRounds = 10; 
const oneHour = 1000 * 60 * 60;



const app = express();
app.use(cors({
    origin: 'http://localhost:3000',   
    credentials: true                 
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


let mongoDB = "mongodb://127.0.0.1:27017/phreddit";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('connected', function() {
  console.log('Connected to database');
});
const store = MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/phreddit' });

app.use(
    session({
      secret: "d7b93e0e6d43e2d5bdcbba2e8e8574bc68d6ed70cf4197f048aa1bc00749b214a5dcd7b347bb99b2a6d1a4b661ae342227aa8a45cfbe5c0b18bb8881a8655f20",
      cookie: {httpOnly: true, maxAge: oneHour},
      resave: false,
      saveUninitialized: false,
      store
    })
);

const fetchCommentsByPostID = async (postID) => {
  const post = await postSchema.findById(postID);
  const postComments = post.commentIDs;
  //console.log(postComments);
  return postComments;
}

const fetchCommentsByCommentID = async (commentID) => {
    const comment = await commentSchema.findById(commentID);
    //console.log(comment.commentIDs);
    return comment.commentIDs;
  }

const fetchReplies = async (replyList, comments) => {
  for (let commentID of comments) {
    const response = await commentSchema.findById(commentID);
    const commentReplies = response;
    // console.log(replyList)
    replyList.push(commentReplies);
    if (commentReplies.commentIDs.length !== 0){
      await fetchReplies(replyList, commentReplies.commentIDs);
    }
  }
  return replyList;
}

const fetchCommentContent = async (commentID) => {
    let comment = await commentSchema.findById(commentID);
    return comment.content;
}

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

function createVote(voteObj) {
    let newVoteDoc = new voteSchema({
        user: voteObj.user,
        post: voteObj.post,
        comment: voteObj.comment,
        vote: voteObj.vote
    });
    return newVoteDoc.save();
}


app.post('/register', async (req, res) => {
    console.log(req.body);
    const { username, password, firstName, lastName, confirmPassword, email } = req.body;
    
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }
    const emailPrefix = email.split('@')[0];

    const loweredPassword = password.toLowerCase();
    const loweredFirstName = firstName.toLowerCase();
    const loweredLastName = lastName.toLowerCase();
    const loweredUsername = username.toLowerCase();
    const loweredEmailPrefix = emailPrefix.toLowerCase();

    if (loweredPassword.includes(loweredFirstName) || loweredPassword.includes(loweredLastName) || loweredPassword.includes(loweredUsername) || loweredPassword.includes(loweredEmailPrefix)) {
        return res.status(400).send('Password should not contain your name, username, or email.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send('Invalid email format');
    }
  
    const salt = await bcrypt.genSalt(saltRounds);
    const pwHash = await bcrypt.hash(password, salt);
    const existingUser = await userSchema.findOne({ username }).exec();
    if (existingUser) {
        return res.status(400).send('Username already exists');
    }
    const existingEmail = await userSchema.findOne({ email }).exec();
    if (existingEmail) {
        return res.status(400).send('Email already exists');
    }

    try {
        const newUser = new userSchema({ username, passwordHash: pwHash, firstName, lastName, email, reputation: 100 });
        const savedUser = await newUser.save();
        res.send(savedUser);
    } catch (err){
        console.log(err);
        res.status(500).send("Internal server errror");
    }
  
    
  });
  

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = (await userSchema.find({email}).exec())[0];
    console.log("Email:", email);
    console.log("User:", user);
    let verdict;
    if (!user) {
        verdict = false;
        return res
          .status(401)
          .send("Invalid email address");
    }
    else {
        verdict = await bcrypt.compare(password, user.passwordHash);
    }
    console.log("VERDICT:", verdict);
    if (verdict) {
        req.session.regenerate(function(err, next) {
            if (err) {
                next(err);
            }
        
            req.session.user = email.trim();
        
            req.session.save(async function (err) {
                if (err) {
                    return next(err);
                }
                console.log("Session saved:", req.session.user);
                const user = await userSchema.findOne({ email: req.session.user }).exec();
                return res.status(200).send(user);
            });
        });
    }
    else {
        res
          .status(401)
          .send("Invalid password");
    }
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.log(err);
          return res.status(500).send('Error logging out');

      }
      res.status(200).send('Logged out');
  });
});

app.get("/auth/check", async (req, res) => {
    if (req.session && req.session.user && req.session.user !== "Guest") {
        console.log("Session user:", req.session.user);
       const user = await userSchema.findOne({ email: req.session.user }).exec();
      res.status(200).send(user);
    } else {
      res.status(400).send("Not logged in");
    }
});
  
app.get("/", async function (req, res) {
    try{
        const allPosts = await postSchema.find({});
        res.send(allPosts);
    }catch(err){
        console.log(err);
        res.status(500).send("Error fetching posts");
    }
});

app.get("/getPost/:postID", async function (req, res) {
    try{
        const post = await postSchema.findById(req.params.postID);
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.send(post);
    } catch(err) {
        console.log(err);
        res.status(500).send("Error fetching post");
    }
});

app.get("/getPostByCommentID/:commentID", async function (req, res) {
    try {
        const post = await postSchema.findOne({ commentID: req.params.commentID });
        if (!post) {
            return res.status(404).send("Post not found");
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching post");
    }
})

app.get("/getUserPosts/:userID", async function (req, res) {
    try {
        const posts = await postSchema.find({ postedBy: req.params.userID });
        if (!posts) {
            return res.status(404).send("Posts not found");
        }
        res.send(posts);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching posts");
    }
})

app.get("/communities", async function (req, res) {
    try{
        const allCommunities = await communitySchema.find({});
        res.send(allCommunities);
    } catch(err){
        console.log(err);
        res.status(500).send("Error fetching communities");
    }
});

app.get("/comments", async function (req, res) {
    try{
        const allComments = await commentSchema.find({});
        res.send(allComments);
    } catch(err){
        console.log(err);
        res.status(500).send("Error fetching comments");
    }
});

app.get("/getCommunity/:postID", async function (req, res) {
    try{
        const community = await communitySchema.findOne({ postIDs: req.params.postID });
        if (!community) {
            return res.status(404).send("Community not found");
        }
        res.send(community);
    } catch(err){
        console.log(err);
        res.status(500).send("Error fetching community");
    }
});

app.get("/getCommunityByID/:id", async function (req, res) {
    try {
        const community = await communitySchema.findById(req.params.id);
        if (!community) {
            return res.status(404).send("Community not found")
        }
        res.send(community);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error fetching community")
    }
});

app.get("/getCommunities/:userID", async function (req, res) {
    try {
        const communities = await communitySchema.find({ createdBy: req.params.userID });
        if (!communities) {
            return res.status(404).send("Communities not found");
        }
        res.send(communities);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching communities");
    }
})

app.get("/linkFlairs", async function (req, res) {
    try {
        const allLinkFlairs = await linkSchema.find();
        if (!allLinkFlairs) {
            res.status(400).send("Link flairs not found");
        }
        res.send(allLinkFlairs);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Errpr fetching link flairs");
    }
});

app.get("/getLinkFlair/:linkFlairID", async function(req, res) {
    try{
        const linkFlair = await linkSchema.findById(req.params.linkFlairID);
        if (!linkFlair) {
            return res.status(404).send("Link flair not found");
        }
        res.send(linkFlair);
    } catch(error){
        console.log(error);
        res.status(500).send("Error fetching link flair");
    }
});

app.get("/getUser/:userID", async function (req, res) {
    try{
        const user = await userSchema.findById(req.params.userID);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send(user);
    } catch(err){
        console.log(err);
        res.status(500).send("Error fetching User");
    }
});

app.get("/getVotes/:userID", async function (req, res) {
    try {
        const votes = await voteSchema.find({ user: req.params.userID });
        if (!votes) {
            return res.status(404).send("Votes not found");
        }
        res.send(votes);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching votes");
    }
});

app.get("/getVotes/", async function (req, res) {
    try {
        const votes = await voteSchema.find({});
        if (!votes) {
            return res.status(400).send("Votes not found");
        }
        res.send(votes);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching votes");
    }
});

app.get("/getComments/:postID", async function (req, res) {
    try{
        const post = await postSchema.findById(req.params.postID );
        // console.log(post);

        //console.log(post.commentIDs);
        const commentIDs = post.commentIDs
        if (!commentIDs) {
            return res.status(404).send("Comments not found");
        }
        const comments = await commentSchema.find({_id: commentIDs} );
        //console.log(comments)
        res.send(comments);
    } catch(error){
        console.error(error);
        res.status(500).send("Error fetching comments");
    }
});

app.get("/getCommentByCommentID/:commentID", async function (req, res) {
    try {
        const comment = await commentSchema.findById(req.params.commentID);
        if (!comment) {
            return res.status(404).send("Comment not found");
        }
        res.send(comment);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching comment");
    }
});

app.get("/getReplies/:commentID", async function (req, res) {
    try {
        const comments = await commentSchema.findById(req.params.commentID);
        if (!comments) {
            return res.send("Comments not found");
        }
        // console.log(comments)
        res.send(comments);
    } catch(error){
        console.error(error);
        res.status(500).send("Error fetching comments");
    }
});

app.get("/getUserComments/:userID", async function (req, res) {
    try {
        const comments = await commentSchema.find({ commentedBy: req.params.userID });
        if (!comments) {
            return res.status(404).send("Comments not found");
        }
        res.send(comments);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching comments");
    }
});

app.get("/getPostsBySearch/:searchTerm", async function (req, res) {
    try {
        const searchTerm = req.params.searchTerm.trim();
        const searchTerms = searchTerm.split(" ");
        console.log(searchTerms);
        const allPosts = await postSchema.find();
        
        const query = {
            $or: searchTerms.map(word => ({
              $or: [
                { title: { $regex: word, $options: "i" } },
                { content: { $regex: word, $options: "i" } }
              ]
            }))
          };
          
        const matchingPosts = await postSchema.find(query);

        const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g; // Pattern match for links

        for (const post of allPosts) {
            const commentList = await fetchCommentsByPostID(post._id);
            const initialComments = await fetchCommentsByPostID(post._id);

            //console.log(initialComments);
            let allReplies = [];
            for (let comment of initialComments) {
                //console.log(comment._id);
                allReplies = await fetchCommentsByCommentID(comment._id);

                if (allReplies.length !== 0) {
                    await fetchReplies(commentList, allReplies);
                }
            }
            //console.log(allReplies);

            const postComments = [];
            for (let comment of commentList) {
                const content = await fetchCommentContent(comment);
                postComments.push(content);
            }

            //console.log(postComments);
            const termFound = postComments.filter((comment) => {
                const result = searchTerms.filter((term) => {
                    return comment.replace(re, (match, text) => text).toLowerCase().includes(term.toLowerCase());
                })
                return result.length > 0;
            });

            if (termFound.length > 0 && !matchingPosts.some(p => p._id.toString() == post._id.toString())) {
                // console.log(post._id);
                matchingPosts.push(post);
            }
        }
        
        for (let post of matchingPosts) {
            post.content.replace(
                re,
                (match, text) => text
              );
        }

        //console.log(matchingPosts);
        if (matchingPosts.length === 0) {
            return res.send([]);
        }
        res.send(matchingPosts.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate))); 
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching posts");
    }
});

app.get("/getPostsByCommunity/:communityID", async (req, res) => {
    try {
        const community = await communitySchema.findById(req.params.communityID);
        if (!community) {
            res.status(404).send("Posts not found");
        }
        res.send(community.postIDs);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching posts");
    }
});

app.get("/getAllUsers", async (req, res) => {
    try {
        const users = await userSchema.find({});
        if (!users) {
            res.status(404).send("Users not found");
        }
        res.send(users);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error fetching users");
    }
});

app.patch("/updateViewCount/:postID", async function (req, res) {
    try{
        const post = await postSchema.findByIdAndUpdate(req.params.postID, {$inc: {views: 1}}, { new: true });
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.send(post);
    } catch(error){
        console.log(error);
        res.status(500).send("Error updating post view count");
    }
});
app.patch("/updateCommentIDsOfPost/:postID", async function (req, res) {
    try{
        const commentID = req.body.commentID;
        const post = await postSchema.findByIdAndUpdate(req.params.postID, { $push: { commentIDs: commentID } }, { new: true });
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.send(post);
    } catch(error){
        console.log(error);
        res.status(500).send("Error updating post comments");
    }
});
app.patch("/updateCommentIDsOfComment/:commentID", async function (req, res) {
    try{
        const commentID = req.body.commentID;
        const comment = await commentSchema.findByIdAndUpdate(req.params.commentID, { $push: { commentIDs: commentID } }, { new: true });
        if (!comment) {
            return res.status(404).send("Comment not found");
        }
        res.send(comment);
    } catch(error){
        console.log(error);
        res.status(500).send("Error updating comment replies");
    }
});

app.patch("/updateCommunityByID/:communityID", async function (req, res) {
    try {
        const { postID } = req.body;
        console.log(postID)
        const community = await communitySchema.findByIdAndUpdate(req.params.communityID, { $push: { postIDs: postID } }, { new: true });
        if (!community) {
            return res.status(404).send("Community not found");
        }
        res.send(community);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error updating community with post");
    }
});
app.patch("/addCommunityMember/:communityID", async function (req, res) {
    try {
        const { userID } = req.body;
        const community = await communitySchema.findByIdAndUpdate(req.params.communityID, { $push: { members: userID } }, { new: true });
        if (!community) {
            return res.status(404).send("Community not found");
        }
        res.send(community);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error updating community members");
    }
});
app.patch("/deleteCommunityMember/:communityID", async function (req, res) {
    try {
        const { userID } = req.body;
        const community = await communitySchema.findByIdAndUpdate(req.params.communityID, { $pull: { members: userID } }, { new: true });
        if (!community) {
            return res.status(404).send("Community not found");
        }
        res.send(community);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting member of community ");
    }
});

app.patch("/updateVoteState", async function (req, res) {
    try {
        const { user, post, vote } = req.body;
        const updatedVote = await voteSchema.findOneAndUpdate({ user: user, post: post }, { $set: { vote: vote } }, { new: true });
        if (!updatedVote) {
            res.status(404).send("Vote not found");
        }
        res.send(updatedVote);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error updating vote state");
    }
});

app.patch("/updateCommentVoteState", async function (req, res) {
    try {
        console.log(req.body);
        const { user, comment, vote } = req.body;
        const updatedVote = await voteSchema.findOneAndUpdate({user: user, comment: comment }, { $set: { vote: vote } }, { new: true });
        if (!updatedVote) {
            res.status(404).send("Vote not found");
        }
        res.send(updatedVote);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error updating comment vote");
    }
});

app.patch("/updateKarmaByPostID/:postID", async function (req, res) {
    try {
        console.log(req.body);
        const { oldState, newState } = req.body;
        const post = await postSchema.findById(req.params.postID);
        console.log(post);
        if (!post) {
            res.status(404).send("Post not found");
        }
        let newKarma = post.votes;
        if (oldState === 0) {
            newKarma += newState;
        }
        else if (oldState === 1 && newState === -1) {
            newKarma -= 2;
        }
        else if (oldState === -1 && newState === 1) {
            newKarma += 2;
        }
        else if (oldState === 1 && newState === 0) {
            newKarma--;
        }
        else if (oldState === -1 && newState === 0) {
            newKarma++;
        }
        const updatedPost = await postSchema.findByIdAndUpdate(req.params.postID, { $set: {votes: newKarma } }, { new: true });
        console.log(updatedPost);
        res.send(updatedPost);
    }
    catch (error) {
        console.log(error);
        res.send(500).send("Error updating post votes");
    }
});

app.patch("/updateKarmaByCommentID/:commentID", async function (req, res) {
    try {
        const { oldState, newState } = req.body;
        const comment = await commentSchema.findById(req.params.commentID);
        if (!comment) {
            res.status(404).send("Comment not found");
        }
        let newKarma = comment.votes;
        if (oldState === 0) {
            newKarma += newState;
        }
        else if (oldState === 1 && newState === -1) {
            newKarma -= 2;
        }
        else if (oldState === -1 && newState === 1) {
            newKarma += 2;
        }
        else if (oldState === 1 && newState === 0) {
            newKarma -= 1;
        }
        else if (oldState === -1 && newState === 0) {
            newKarma += 1;
        }

        const updatedComment = await commentSchema.findByIdAndUpdate(req.params.commentID, { $set: { votes: newKarma } }, { new: true });
        res.send(updatedComment);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error updating comment votes");
    }
});

app.patch("/updateUserReputation/:userID", async function (req, res) {
    try {
        console.log(req.body);
        const { oldState, newState } = req.body;
        const user = await userSchema.findById(req.params.userID);
        if (!user) {
            return res.status(404).send("User could not be found");
        } 
        let reputation = user.reputation; 
        if (oldState === 0 && newState === 1) {
            reputation += 5;
        }
        else if (oldState === 0 && newState === -1) {
            reputation -= 10;
        }
        else if (oldState === 1 && newState === 0) {
            reputation -= 5;
        }
        else if (oldState === -1 && newState === 0) {
            reputation += 10;
        }
        else if (oldState === 1 && newState === -1) {
            reputation -= 15;
        }
        else if (oldState === -1 && newState === 1) {
            reputation += 15;
        }

        const updatedUser = await userSchema.findByIdAndUpdate(req.params.userID, { $set: {reputation: reputation } }, { new: true });
        console.log(updatedUser);
        res.send(updatedUser);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error updating user reputation");
    }
});

app.patch("/editComment/:commentID", async function (req, res) {
    try {
        const updatedComment = await commentSchema.findByIdAndUpdate(req.params.commentID, req.body, { new: true });
        if (!updatedComment) {
            return res.status(404).send("Error finding comment");
        }
        res.send(updatedComment);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error editing comment");
    }
});

app.patch("/editCommunity/:communityID", async function (req, res) {
    try {
        const updatedCommunity = await communitySchema.findByIdAndUpdate(req.params.communityID, req.body, { new: true });
        if (!updatedCommunity) {
            return res.status(404).send("Error finding community");
        }
        res.send(updatedCommunity);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error editing community");
    }
});

app.patch("/editPost/:postID", async function (req, res) {
    try {
        const { linkFlairID } = req.body;
        let updatedPost = await postSchema.findByIdAndUpdate(req.params.postID, req.body, { new: true });
        if (!updatedPost) {
            return res.status(404).send("Error finding post");
        }
        if (!linkFlairID) {
            updatedPost = await postSchema.findByIdAndUpdate(req.params.postID, { $unset: { linkFlairID: "" } }, { new: true });
        } 

        res.send(updatedPost)
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error editing post");
    }
});

app.post("/addCommunity", async function (req, res) {
    console.log(req.body)
    try{
        const community = await createCommunity(req.body);
        res.send(community);
    } catch(err){
        console.log(err)
        res.status(500).send("Error adding community");
    }
});

app.post("/addPost", async function (req, res) {
    // console.log(req.body)
    try {
        const post = await createPost(req.body);
        res.send(post);
    }
    catch (error) {
        console.log(error)
        res.status(400).send("Error creating post");
    }
});

app.post("/addLinkFlair", async function (req, res) {
    try {
        const linkFlair = await createLinkFlair(req.body);
        res.send(linkFlair);
    }
    catch (err) {
        console.error(err);
        res.status(400).send("Error creating link flair");
    }
});

app.post("/addComment", async function (req, res) {
    try {
        const comment = await createComment(req.body);
        res.send(comment);
    }
    catch (error) {
        console.log(error);
        res.status(400).send("Error creating comment");
    }
});

app.post("/addVote", async function (req, res) {
    console.log(req.body);
    try {
        const vote = await createVote(req.body);
        res.send(vote);
    }
    catch (error) {
        console.log(error);
        res.status(400).send("Error creating vote");
    }
});

app.delete("/deleteVote", async function (req, res) {
    try {
        const { user, post } = req.body;
        const vote = await voteSchema.findOneAndDelete( { user: user._id, post: post._id} );
        console.log(vote);
        if (!vote) {
            return res.status(404).send("Vote not found");
        }
        res.status(200).send("Vote deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting vote");
    }
});

app.delete("/deleteCommentVote", async function (req, res) {
    console.log(req.body);
    try {
        const { user, comment } = req.body;
        const vote = await voteSchema.findOneAndDelete( { user: user, comment: comment });
        if (!vote) {
            return res.status(404).send("Vote not found");
        }
        res.status(200).send("Vote deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting vote");
    }
});

app.delete("/deleteComment/:commentID", async function (req, res) {
    try {
        const { commentIDs } = req.body;
        console.log(commentIDs);
        const deletedComments = await commentSchema.deleteMany( {_id: { $in: commentIDs } } );
        if (!deletedComments) {
            return res.status(404).send("Comment not found");
        }
        await postSchema.findOneAndUpdate(
            { commentIDs: req.params.commentID }, 
            { $pull: { commentIDs: req.params.commentID } } 
        );
        await commentSchema.findOneAndUpdate(
            { commentIDs: req.params.commentID }, 
            { $pull: { commentIDs: req.params.commentID } } 
        );
        res.status(200).send("Comment deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting comment");
    }
});

app.delete("/deletePost/:postID", async function (req, res) {
    try {
        const deletedPost = await postSchema.findByIdAndDelete(req.params.postID);
        if (!deletedPost) {
            return res.status.apply(404).send("Post not found");
        }
        console.log(deletedPost);
        await communitySchema.findOneAndUpdate( 
            { postIDs: req.params.postID }, 
            { $pull: { postIDs: req.params.postID }}
        );
        await commentSchema.deleteMany( 
            { postID: req.params.postID },
            { $pull: { postID: req.params.postID } }
        );
        res.status(200).send("Post deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting post");
    }
});

app.delete("/deleteCommunity/:communityID", async (req, res) => {
    try {
        const deletedCommunity = await communitySchema.findByIdAndDelete(req.params.communityID);
        if (!deletedCommunity) {
            res.status(404).send("Community not found");
        }
        res.status(200).send("Community deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting community");
    }
});

app.delete("/deleteUser/:userID", async (req, res) => {
    try {
        const deletedUser = await userSchema.findByIdAndDelete(req.params.userID);
        if (!deletedUser) {
            res.status(404).send("User not found");
        }
        await communitySchema.findOneAndUpdate( 
            { members: req.params.userID }, 
            { $pull: { members: req.params.userID }}
        );
        const userComments = await commentSchema.find({ commentedBy: req.params.userID });
        const commentIDs = userComments.map(comment => comment._id);

        await postSchema.updateMany(
            { commentIDs: { $in: commentIDs } },
            { $pull: { commentIDs: { $in: commentIDs } } }
        );

        await commentSchema.deleteMany(
            { commentedBy: req.params.userID },
            { $pull: { commentedBy: req.params.userID } }
        );
        res.status(200).send("User deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Error deleting user");
    }
});

app.get("/testServer", (req, res) => {
    res.send("Server is running");
});

const server = app.listen(8000, () => {
    console.log("Server listening on port 8000...");
});

process.on('SIGINT', () => {
  if(db) {
    db.close()
      .then(() => console.log('Server closed. Database instance disconnected.'))
      .catch((err) => console.log(err));
  }
  console.log('Server closed. Database instance disconnected.');
})
app.closeServer = () => {
    return new Promise((resolve) => {
      server.close(async () => {
        try {
          if (store && typeof store.close === 'function') {
            await store.close(); // Close session store FIRST
          }
  
          await mongoose.disconnect(); // Then close mongoose
        } catch (_) {
            console.log(_);
          // Optional: log the error if debugging
        }
        resolve();
      });
    });
  };
  
  
  
  
  
  

module.exports = { app };