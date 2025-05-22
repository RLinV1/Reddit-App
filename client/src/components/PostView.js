import React, { useEffect, useState } from "react";
import axios from "axios";
import { getCommunityName, getTimeStamp, fetchReplies, renderHyperLink, fetchCommentsByPostID, getLinkFlair, fetchRepliesUsernames, getPostVoteState, getCommentVoteList } from "../util/util";
import AddComment from "./AddComment";
const PostView = ({ user, postID }) => {

  const [communityName, setCommunityName] = useState("");
  const [post, setPost] = useState(null);
  const [linkFlair, setLinkFlair] = useState("");
  const [isCommentView, setIsCommentView] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentData, setCommentData] = useState({
      comment: "",
      isReply: false,
      parentCommentID: "",
      parentPostID: "",
    });
  const [commentListUsernames, setCommentListUsernames] = useState({});
  const [username, setUsername] = useState("");
  const [showError, setShowError] = useState(false);
  const [postVoteState, setPostVoteState] = useState(0);
  const [commentVoteList, setCommentVoteList] = useState([]);
  const [replyVoteList, setReplyVoteList] = useState([]);
  const [error, setError] = useState({
    postReputationError: "",
    commentReputationError: "",
    replyReputationError: "",
  });
  const [errorComment, setErrorComment] = useState("");

  const setReplyData = (replyData, indentSpace) => {
    return replyData.map((replyID, index) => {
      const reply = commentList.filter((reply) => reply._id === replyID)[0];
      if (!reply) return null;

      let errorMessages = {
        replyReputationError: "",
      };
      const userVote = replyVoteList.find(vote => vote.comment.toString() === replyID.toString());
      //console.log(userVote);
      return (
        <div key={index} class="comment" id={reply._id} style={{paddingLeft: `${indentSpace}px`}}>
          
          <div className="comment-outside-container">

              <div className="vote-container">
                <div className={`comment-upvote-arrow ${userVote && userVote.vote === 1 ? `highlighted` : ``}${user === "Guest" ? "guest" : ""}`} onClick={ user === "Guest" ? undefined : () => {

                    if (user.reputation >= 50) {
                      if (userVote && userVote.vote === 1) {
                        //console.log(userVote);
                        updateCommentVoteState(1, 0, replyID, true);
                      }
                      else if (!userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(0, 1, replyID, true);
                      }
                      else if(userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(-1, 1, replyID, true);
                      }
                    }
                    else {
                      errorMessages.replyReputationError = "Error, your account is not in good standing.";
                      setError(errorMessages);
                      setErrorComment(reply._id);
                    }
                  }}></div>
                <div className="votes">{reply.votes}</div>
                <div className={`comment-downvote-arrow ${userVote && userVote.vote === -1 ? `highlighted` : ``}${user === "Guest" ? "guest" : ""}`} onClick={ user === "Guest" ? undefined : () => {
                    if (user.reputation >= 50) {
                      if (userVote && userVote.vote === -1) {
                        //console.log(userVote);

                        updateCommentVoteState(-1, 0, replyID, true);
                      }
                      else if (!userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(0, -1, replyID, true);
                      }
                      else if (userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(1, -1, replyID, true);
                      }
                    }
                    else {
                      errorMessages.replyReputationError = "Error, your account is not in good standing.";
                      setError(errorMessages);
                      setErrorComment(reply._id);
                    }
                  }}></div>
              </div>
            <div class="comment-container">
              
              {commentListUsernames[reply.commentedBy]} | {getTimeStamp(reply.commentedDate)}
              <div class="comment-content">{renderHyperLink(reply.content)}</div>
              
              <div class={`reply-button ${user === "Guest" ? "guest" : ""}`} id={reply._id} onClick={() => {handleCommentView(true, reply._id, post._id)}}>
                Reply
              </div>
            </div>
          </div>
          <div id="vote-error" class="post-error-message">{ reply._id === errorComment ? error.replyReputationError : "" }</div>
          {reply.commentIDs.length !== 0 && setReplyData(reply.commentIDs, indentSpace + 20)}

        </div>
        
      );
    });
  };
  
  useEffect(() => {
    axios.get(`http://localhost:8000/getPost/${postID}`).then((res) => {
      setPost(res.data);
    }).catch(err => { setShowError(true); console.log(err);});
  }, [postID, isCommentView]);

  useEffect(() => {
    if (post && post._id && post.commentIDs) {
      
      getCommunityName(post._id).then(res => setCommunityName(res)).catch(err => { setShowError(true); console.log(err)});

      if (post.linkFlairID !== undefined){
        console.log(post.linkFlairID)
        getLinkFlair(post.linkFlairID).then(res => setLinkFlair(res)).catch(err => { setShowError(true); console.log(err)});
      }
      fetchCommentsByPostID(post._id).then(res => {
        // console.log(res)
        setComments(res.sort((a, b) => new Date(b.commentedDate) - new Date(a.commentedDate)));
      }).catch(err => { setShowError(true); console.log(err)});

      if (post.commentIDs.length > 0){
        const replyList = []
        console.log(post.commentIDs);
        fetchReplies(replyList, post.commentIDs).then(res => {
          // console.log(res);
          
          setCommentList(res);
        }).catch(err => { setShowError(true); console.log(err)});
      }
     

      axios.get(`http://localhost:8000/getUser/${post.postedBy}`).then(res => {
        setUsername(res.data.username);
      }).catch(err => { setShowError(true); console.log(err)});

      if (user !== "Guest") {
        getPostVoteState(user._id, post._id).then(userPostVoteState => {
          //console.log(user._id);
          //console.log(post._id);
          if (userPostVoteState !== null) {
            setPostVoteState(userPostVoteState);
          }
        }).catch(error => {setShowError(true); console.log(error)});


        
        
      }
    }
  }, [post, user]);

  useEffect(() => {
      if (user !== "Guest" && commentList.length > 0) {
        getCommentVoteList(user._id, commentList).then(userVoteList => {
          //console.log(userVoteList);
          setReplyVoteList(userVoteList);  
        }).catch(error => {
          setShowError(true);
          console.log(error);
        });
      }
  }, [commentList, user._id, user]);

  useEffect(() => {
    if (user !== "Guest" && comments.length > 0) {
          getCommentVoteList(user._id, comments).then(userVoteList => {
            //console.log(userVoteList);
            setCommentVoteList(userVoteList);  
          }).catch(error => {
            setShowError(true);
            console.log(error);
          });
    }
  }, [user, comments]);

  useEffect(() => {
    if (commentList && commentList.length !== 0) {
      console.log(commentList)
      fetchRepliesUsernames(commentList).then(res => {
        // console.log(res)
        setCommentListUsernames(res);
      }).catch(err => { setShowError(true); console.log(err)});
    }
  }, [commentList]);

  useEffect(() => {
    if (user !== "Guest" && commentList.length > 0) {
      getCommentVoteList(user._id, commentList).then(userVoteList => {
        //console.log(userVoteList);
        setReplyVoteList(userVoteList);  
      }).catch(error => {
        setShowError(true);
        console.log(error);
      });
    }
  }, [user, commentList]);

  useEffect(() => {
    if (user !== "Guest" && comments.length > 0) {
      getCommentVoteList(user._id, comments).then(userVoteList => {
        //console.log(userVoteList);
        setCommentVoteList(userVoteList);  
      }).catch(error => {
        setShowError(true);
        console.log(error);
      });
    }
  }, [user, comments]);



  const handleCommentView = (isReply, parentCommentID, parentPostID) => {
    setIsCommentView(true);
    setCommentData({...commentData, isReply: isReply, parentCommentID: parentCommentID, parentPostID: parentPostID})
  }
  // reset the comment view and fetch the comments again
  const resetCommentView = () => {
    fetchCommentsByPostID(post._id).then(res => {
      // console.log(res)
      setComments(res.sort((a, b) => new Date(b.commentedDate) - new Date(a.commentedDate)));
    }).catch(err => { setShowError(true); console.log(err)});
    const replyList = []
    fetchReplies(replyList, post.commentIDs).then(res => {
      // console.log(res);
      
      setCommentList(res);
    }).catch(err => { setShowError(true); console.log(err)});
    setIsCommentView(false)
  }

  const updatePostVoteState = async (oldState, newState) => {
    try {
      let updatedPost = null;
      if (newState === 0) {
        await axios.delete("http://localhost:8000/deleteVote", { data: {user, post} });
        updatedPost = await axios.patch(`http://localhost:8000/updateKarmaByPostID/${post._id}`, {oldState, newState});
        await axios.patch(`http://localhost:8000/updateUserReputation/${post.postedBy}`, {oldState, newState});
        //console.log(deletedVote);
        setPostVoteState(0);
        //console.log(postVoteState);
      }
      else {
        const data = {
          user: user._id,
          post: post._id,
          vote: newState
        }
        if (oldState === 0) {
          await axios.post("http://localhost:8000/addVote", data);
          updatedPost = await axios.patch(`http://localhost:8000/updateKarmaByPostID/${post._id}`, {oldState, newState});
          await axios.patch(`http://localhost:8000/updateUserReputation/${post.postedBy}`, {oldState, newState});
          //console.log(addedVote);
          setPostVoteState(newState);
        }
        else {
          await axios.patch("http://localhost:8000/updateVoteState", data);
          updatedPost = await axios.patch(`http://localhost:8000/updateKarmaByPostID/${post._id}`, {oldState, newState});
          console.log(oldState);
          console.log(newState);
          await axios.patch(`http://localhost:8000/updateUserReputation/${post.postedBy}`, {oldState, newState});
          //console.log(updatedVote);
          setPostVoteState(newState);
        }
      }
      console.log(updatedPost);
      if (updatedPost !== null) {
        setPost(updatedPost.data);
      }
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }

  }

  const updateCommentVoteState = async ( oldState, newState, commentID, repliesOrNot ) => {
    try {
      let updatedComment = null;
      const commentResponse = await axios.get(`http://localhost:8000/getCommentByCommentID/${commentID}`);
      const comment = commentResponse.data;
      if (newState === 0) {
        await axios.delete("http://localhost:8000/deleteCommentVote", {
          data: {
              user: user._id,  
              comment: commentID 
          }
      });
        updatedComment = await axios.patch(`http://localhost:8000/updateKarmaByCommentID/${commentID}`, { oldState, newState });
        await axios.patch(`http://localhost:8000/updateUserReputation/${comment.commentedBy}`, {oldState, newState});
      }
      else {
        const data = {
          user: user._id,
          comment: commentID,
          vote: newState
        }
        if (oldState === 0) {
          await axios.post("http://localhost:8000/addVote", data);
          updatedComment = await axios.patch(`http://localhost:8000/updateKarmaByCommentID/${commentID}`, { oldState, newState });
          await axios.patch(`http://localhost:8000/updateUserReputation/${comment.commentedBy}`, {oldState, newState});
        }
        else {
          await axios.patch("http://localhost:8000/updateCommentVoteState", data);
          updatedComment = await axios.patch(`http://localhost:8000/updateKarmaByCommentID/${commentID}`, { oldState, newState });
          await axios.patch(`http://localhost:8000/updateUserReputation/${comment.commentedBy}`, {oldState, newState});
        }
      }

      if (updatedComment !== null) {
        if (repliesOrNot) {
          setCommentList((commentList) => {
            return commentList.map((existingComment) =>
              existingComment._id === updatedComment.data._id ? updatedComment.data : existingComment
            );
          });
        }
        else {
          setComments((comments) => {
            return comments.map((existingComment) =>
              existingComment._id === updatedComment.data._id ? updatedComment.data : existingComment
            );
          });
        }
      }
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  if (showError) {
    return (
      <div className="error-container">
        <p>Click the <strong>Phreddit logo</strong> at the top to return to the welcome page.</p>
      </div>
    );
  }



  if (isCommentView && user !== "Guest"){
    return (
      <AddComment user={user} commentData={commentData} setCommentData={setCommentData} resetCommentView={resetCommentView} commentPost={post}/>
    )
  }


  if (!post) {
    return <div>Loading</div>;
  }
 
  return (
    <div class="post-view-container">
      {communityName} | {getTimeStamp(post.postedDate)}
      <div class="post-view-username">Posted By: {username}</div>
      <div class="post-view-title">{post.title}</div>
      <div class="post-view-link-flair">{linkFlair}</div>
      <div class="post-view-content">{renderHyperLink(post.content)}</div>
      <div class="post-view-info">
        <div class="post-views">Views: {post.views}</div>
        <div class="post-comments">Comments:  {commentList ? Object.keys(commentList).length :  0}</div>
      </div>
      <div class="post-view-votes">
        <div className="post-vote-container">
          <div className={`post-upvote-arrow ${postVoteState === 1 ? `highlighted` : ``}${user === "Guest" ? "guest" : ""}`} onClick={ user === "Guest" ? undefined : () => {
            let errorMessages = {
              postReputationError: "",
            };
            if (user.reputation >= 50) {
              if (postVoteState === 1) {
                updatePostVoteState(1, 0);
              }
              else if (postVoteState === 0) {
                updatePostVoteState(0, 1);
              }
              else {
                updatePostVoteState(-1, 1);
              }
            }
            else {
              errorMessages.postReputationError = "Error, your account is not in good standing.";
              setError(errorMessages);
            }
          }}></div>
          <div className="votes">{post.votes}</div>
          <div className={`post-downvote-arrow ${postVoteState === -1 ? `highlighted` : ``}${user === "Guest" ? "guest" : ""}`} onClick={ user === "Guest" ? undefined : () => {
            let errorMessages = {
              postReputationError: "",
            };
            if (user.reputation >= 50) {
              if (postVoteState === -1) {
                updatePostVoteState(-1, 0);
              }
              else if (postVoteState === 0) {
                updatePostVoteState(0, -1);
              }
              else {
                updatePostVoteState(1, -1);
              }
            }
            else {
              errorMessages.postReputationError = "Error, your account is not in good standing.";
              setError(errorMessages);
            }
          }}></div>
        </div>
       <div className={`post-view-add-comment ${user === "Guest" ? "guest" : ""}`} onClick={user === "Guest" ? undefined : () => {handleCommentView(false, "", post._id)}}>Add a Comment</div>
      </div>
      <div id="vote-error" class="post-error-message">{error.postReputationError}</div>
      <div>
        <hr />
      </div>
      <div id="post-comments">
       {commentList && commentList.length !== 0 && commentListUsernames ? comments.map((comment, index) => {
        //console.log(comment);
        const userVote = commentVoteList.find(vote => vote.comment.toString() === comment._id.toString());
        return (
          <div key={index} class="comment" id={comment._id}>
            
            <div className="comment-outside-container">
                <div class="vote-container">
                  <div className={`comment-upvote-arrow ${userVote && userVote.vote === 1 ? `highlighted` : ``}${user === "Guest" ? "guest" : ""}`} onClick={ user === "Guest" ? undefined : () => {
                    let errorMessages = {
                      reputationError: "",
                    };
                    if (user.reputation >= 50) {
                      if (userVote && userVote.vote === 1) {
                        //console.log(userVote);
                        updateCommentVoteState(1, 0, comment._id, false);
                      }
                      else if (!userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(0, 1, comment._id, false);
                      }
                      else if(userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(-1, 1, comment._id, false);
                      }
                    }
                    else {
                      errorMessages.commentReputationError = "Error, your account is not in good standing.";
                      setError(errorMessages);
                      setErrorComment(comment._id);
                    }
                  }}></div>
                  <div className="votes">{comment.votes}</div>
                  <div className={`comment-downvote-arrow ${userVote && userVote.vote === -1 ? `highlighted` : ``}${user === "Guest" ? "guest" : ""}`} onClick={ user === "Guest" ? undefined : () => {
                    let errorMessages = {
                      reputationError: "",
                    };
                    if (user.reputation >= 50) {
                      if (userVote && userVote.vote === -1) {
                        //console.log(userVote);

                        updateCommentVoteState(-1, 0, comment._id, false);
                      }
                      else if (!userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(0, -1, comment._id, false);
                      }
                      else if (userVote) {
                        //console.log(userVote);

                        updateCommentVoteState(1, -1, comment._id, false);
                      }
                    }
                    else {
                      errorMessages.commentReputationError = "Error, your account is not in good standing.";
                      setError(errorMessages);
                      setErrorComment(comment._id);
                    }
                  }}></div>
                </div>
            <div class="comment-container">
              {commentListUsernames &&  commentListUsernames[comment.commentedBy]} | {getTimeStamp(comment.commentedDate)}
              <div className="comment-content"/>
              {renderHyperLink(comment.content)}
              <div class={`reply-button ${user === "Guest" ? "guest" : ""}`} id={comment._id} onClick={() => {handleCommentView(true, comment._id, post._id)}}>
                Reply
              </div>
            </div>
            </div>
            <div id="vote-error" class="post-error-message">{ errorComment === comment._id ? error.commentReputationError : "" }</div>
            {comment.commentIDs.length !== 0 && setReplyData(comment.commentIDs, 20)}
         </div>
        );
       }) : <div class=""></div>}
      </div>
    </div>
  );
};



export default PostView;
