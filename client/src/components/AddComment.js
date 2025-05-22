import React, {useState} from "react";
import axios from "axios";
const AddComment = ({user, commentData, setCommentData, resetCommentView, commentPost}) => {
  
  const [error, setError] = useState({
    commentContentError: "",
    serverError: "",
  });

  const submitComment = () => {
    let valid = true; // check for valid user input
    let errorMessages = {
      commentContentError: "",
    };
    const bracketsParentheses = /\[[^\]]*\]\([^)]*\)/g;
    const empty_brackets = /\[\s*\]|\(\s*\)/g;
    const http_regex = /\(https?:\/\/[^\s)]*\)/;

    if (bracketsParentheses.test(commentData.comment)) {
      if (empty_brackets.test(commentData.comment)) {
        errorMessages.commentContentError = "Invalid input. Must have no empty brackets or parentheses.";
        valid = false;
      }
      else {
        if (!http_regex.test(commentData.comment)) {
          errorMessages.commentContentError = "Invalid input. The URL must begin with http:// or https://.";
          valid = false;
        }
      }
    }
    
    if (commentData.comment.length === 0) {
      errorMessages.commentContentError = "Comment description is required";
      valid = false;
    } else if (commentData.comment.length > 500) {
      errorMessages.commentContentError =
        "Comment description exceeds maximum character count";
      valid = false;
    }

  

    if (valid) {
      const comment = {
        content: commentData.comment,
        commentIDs: [],
        commentedBy: user._id,
        commentedDate: new Date(),
        votes: 0,
        postID: commentPost._id
      };
      // console.log(commentData);

      axios.post("http://localhost:8000/addComment", comment)
      .then(res => {
        // console.log(res);
        if (commentData.isReply) {
          axios.patch(`http://localhost:8000/updateCommentIDsOfComment/${commentData.parentCommentID}`, {
            commentID: res.data._id,
          }).then(() => {resetCommentView()})
          .catch(err => {  
            console.log(err)
            setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
          });
        } else {
          axios.patch(`http://localhost:8000/updateCommentIDsOfPost/${commentData.parentPostID}`, {
            commentID: res.data._id,
          }).then(() => {resetCommentView()})
          .catch(err => {
            console.log(err)
            setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
          })
        }
      })
      .catch(err => {
        console.log(err)
        setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
      });
      
       
      setCommentData({  
        comment: "",
        isReply: false,
        parentCommentID: "",
        parentPostID: "",
      });
      
    } else {
      setError(errorMessages);
      
      return false;
    }
  };

  return (
    <div id="add-comment-container">
      <div class="post-heading">Add a Comment</div>
      <div id="add-comment">
        <div class="add-comment-description">
          <label for="add-comment-description">
            Comment (required, 500 characters max):
          </label>
          <br />
          <textarea
            id="add-comment-description-area"
            name="add-comment-description"
            onChange={(event) => {
              setCommentData({...commentData, comment: event.target.value });
            }}
          ></textarea>
          <div id="add-comment-description-error" class="error-message">
            {error.commentContentError}
          </div>
        </div>
        <div class="submit-comment">
          <button id="submit-comment" onClick={submitComment}>
            Submit Comment
          </button>
        </div>
        <div id="add-comment-description-error" class="error-message">
            {error.serverError}
          </div>
      </div>
    </div>
  );
};

export default AddComment;