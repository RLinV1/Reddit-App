import React, { useEffect } from 'react'
import { useState } from 'react';
import axios from 'axios';

const CreatePost = ( { user, setResetPostView } ) => {

  const [postTitle, setPostTitle] = useState("");
  const [postFlairText, setPostFlairText] = useState("");
  const [postContent, setPostContent] = useState("");
  const [error, setError] = useState({
    postCommunityError: "",
    postTitleError: "",
    linkFlairError: "",
    postContentError: "",
    serverError: ""
  });

  const [communityList, setCommunityList] = useState([]);
  const [communityOption, setCommunityOption] = useState("");
  const handleCommunityOptions = (event) => {
    setCommunityOption(event.target.value);
  }

  const [flairList, setFlairList] = useState([]);
  const [flairOption, setFlairOption] = useState("");
  const handleFlairOptions = (event) => {
    setFlairOption(event.target.value);
  }

  const fetchData = async () => {
    try{
      const communityResponse = await axios.get("http://localhost:8000/communities");
      setCommunityList(communityResponse.data);
  
      const flairResponse = await axios.get("http://localhost:8000/linkFlairs");
      setFlairList(flairResponse.data);
    } catch (error) {
      console.log("Error fetching data: ", error);
      setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
    }
   
  }



  useEffect(() => {
    if (user !== "Guest") {
      fetchData();
    }
  }, [user]);

  if (user === "Guest") {
    return (
      <div id="error-message">You must be logged in to create a post.</div>
    );
  }

  async function addPost(title, content, linkFlair, selectedCommunity) {
    try {
      const data = { 
        title: title,
        content: content,
        postedBy: user._id,
        postedDate: new Date(),
        views: 0,
        commentIDs: [],
        votes: 0
       }
       if (linkFlair){
        data["linkFlairID"] = linkFlair
       }
       axios.post("http://localhost:8000/addPost", data).then((post) => {
        console.log(selectedCommunity)
         axios.patch(`http://localhost:8000/updateCommunityByID/${selectedCommunity}`, {
          postID: post.data._id,
         }).then(res => {
          setResetPostView(true);
          console.log(res)
        }).catch(err => {
            console.log("Error updating community: ", err);
            setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
          })
       }).catch(err => {
        setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
       });

    }
    catch (error) { 
      console.log(selectedCommunity)
      console.log("Error adding post: ", error);
      setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
    }
  }
  
  async function addLinkFlair(postFlairText) {
    try {
      const response = await axios.post("http://localhost:8000/addLinkFlair", {
        content: postFlairText,
      });
      return response.data;
    }
    catch (error) {
      setError({serverError: "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page."});
      console.log("Error adding link flair: ", error);
    }
  }

  async function submitPost () {
    let errorMessages = {
      postCommunityError: "",
      postTitleError: "",
      linkFlairError: "",
      postContentError: "",
    };

    //console.log(communityOption);

    let valid = true;
    let flairDropdownUsed = false;

    const bracketsParentheses = /\[[^\]]*\]\([^)]*\)/g;
    const empty_brackets = /\[\s*\]|\(\s*\)/g;
    const http_regex = /\(https?:\/\/[^\s)]*\)/g;
    
    if (bracketsParentheses.test(postContent)) {
      if (empty_brackets.test(postContent)) {
        errorMessages.postContentError = "Invalid input. Must have no empty brackets or parentheses.";
        valid = false;
      }
      else {
        if (!http_regex.test(postContent)) {
          errorMessages.postContentError = "Invalid input. The URL must begin with http:// or https://.";
          valid = false;
        }
      }
    }

    if (communityOption === "") {
      errorMessages.postCommunityError = "A community is required.";
      valid = false;
    }

    if (postTitle.length === 0) {
      errorMessages.postTitleError = "Post title is required.";
      valid = false;
    } 
    else if (postTitle.length > 100) {
      errorMessages.postTitleError = "Post title exceeds maximum character count.";
      valid = false;
    }

    if (flairOption !== "" && postFlairText !== "") {
      errorMessages.linkFlairError = "Only 1 Link Flair selection allowed.";
      valid = false;
    }
    else if (postFlairText.length > 30) {
      errorMessages.linkFlairError = "New Link Flair exceeds maximum character count.";
      valid = false;
    }
    else if (flairOption !== "") {
      flairDropdownUsed = true;
      console.log(flairDropdownUsed);
      console.log(flairOption);
    }

    if (postContent.length === 0) {
      errorMessages.postContentError = "Post content is required.";
      valid = false;
    }

    if (valid) {
      if (flairDropdownUsed) {
        await addPost(postTitle, postContent, flairOption, communityOption);
      }
      else {
        if (postFlairText === "") {
          // let linkFlairText = "";
          await addPost(postTitle, postContent, null, communityOption);
        }
        else {
          const newLinkFlair = await addLinkFlair(postFlairText);
          await addPost(postTitle, postContent, newLinkFlair._id, communityOption);
        }
      }
    };


    if (!valid) {
      setError(errorMessages);
      return false;
    }

  }
  return (
    <div id="new-post-container">
    <div class="post-heading">Create a New Post</div>
    <div id="create-post-section">
        <div class="new-post-community">
          <label for="community-dropdown">Select a Community (required):</label>
          <select id="community-dropdown" value={communityOption} onChange={handleCommunityOptions}>
          <option value = "" disabled>Select a Community</option>
          {communityList.sort((a, b) => {
              const community1 = a.members.includes(user._id);
              const community2 = b.members.includes(user._id);

              if (community1 && !community2) return -1;
              if (!community1 && community2) return 1;
              return 0;
            })
            .map((community) => (
              <option key={community._id} value={community._id}>
                {community.name}
              </option>
          ))}
          </select>
        </div>
        <div id="post-community-error" class="error-message">{error.postCommunityError}</div> 
        <div class="new-post-title">
          <label for="new-post-title">Post Title (required, 100 characters max):</label><br />
          <textarea id="new-post-title" name="new-post-title" onChange={(event) => setPostTitle(event.target.value)}></textarea>
          <div id="post-title-error" class="error-message">{error.postTitleError}</div> 
        </div>
        <div class="new-post-flair-dropdown">
          <label for="flair-dropdown">Select an Existing Flair (optional):</label>
          <select id="flair-dropdown" value={flairOption} onChange={handleFlairOptions}>
          <option value = "">No link flair</option>
          {flairList.map((flair) => (
            <option key={flair._id} value={flair._id}>
              {flair.content}
            </option>
          ))}
          </select>
        </div>
        <div class="new-post-flair-text">
          <label for="new-post-flair-text">Or Create a New Link Flair (optional, 30 characters max):</label><br />
          <textarea id="new-post-flair-text" name="new-post-flair-text" onChange={(event) => setPostFlairText(event.target.value)}></textarea>
          <div id="post-flair-error" class="error-message">{error.linkFlairError}</div>
        </div>
        <div class="new-post-content">
          <label for="new-post-content">Content (required):</label><br />
          <textarea id="new-post-content" name="new-post-content" onChange={(event) => setPostContent(event.target.value)}></textarea>
          <div id="post-content-error" class="error-message">{error.postContentError}</div>
        </div>
        <div class="submit-new-post">
          <button id="submit-new-post" onClick={submitPost}>Submit Post</button>
        </div>
        <div id="post-content-error" class="error-message">{error.serverError}</div>

    </div>
  </div>
  );
}

export default CreatePost