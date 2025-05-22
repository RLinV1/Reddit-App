import React, { useState } from "react";
import axios from "axios";
const EditComment = ({ user, resetCommentView, editComment, setProfileView }) => {
  const [commentContent, setCommentContent] = useState(editComment.content);
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

    if (bracketsParentheses.test(commentContent)) {
      if (empty_brackets.test(commentContent)) {
        errorMessages.commentContentError = "Invalid input. Must have no empty brackets or parentheses.";
        valid = false;
      }
      else {
        if (!http_regex.test(commentContent)) {
          errorMessages.commentContentError = "Invalid input. The URL must begin with http:// or https://.";
          valid = false;
        }
      }
    }
    
    if (commentContent.length === 0) {
      errorMessages.commentContentError = "Comment description is required";
      valid = false;
    } else if (commentContent.length > 500) {
      errorMessages.commentContentError =
        "Comment description exceeds maximum character count";
      valid = false;
    }

  

    if (valid) {
      const comment = {
        content: commentContent,
      };
      console.log(comment);

      axios.patch(`http://localhost:8000/editComment/${editComment._id}`, comment)
      .then(res => {
        console.log(res);
        setProfileView(true);
      })
      .catch(err => {
        console.log(err)
        setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
      });     
    } else {
      setError(errorMessages);
      
      return false;
    }
  };

  return (
    <div id="add-comment-container">
      <div class="post-heading">Editing Comment</div>
      <div id="add-comment">
        <div class="add-comment-description">
          <label for="add-comment-description">
            Comment (required, 500 characters max):
          </label>
          <br />
          <textarea
            id="add-comment-description-area"
            name="add-comment-description"
            value={commentContent}
            onChange={(event) => {
              setCommentContent(event.target.value);
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

export default EditComment;