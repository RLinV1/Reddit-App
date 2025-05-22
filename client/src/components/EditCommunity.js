import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
const EditCommunity = ({user, handleCommunitySelect, communities, community }) => {
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [error, setError] = useState({
    communityNameError: "",
    communityDescriptionError: "",
    serverError: "",
  });

  useEffect(() => {
    if (community) {
      setCommunityName(community.name);
      setCommunityDescription(community.description);
    }
  }, [community]);


  if (user === "Guest") {
    return (
      <div id="error-message">You must be logged in to create a community.</div>
    );
  }

  const engenderCommunity =  () => {
    let errorMessages = {
      communityNameError: "",
      communityDescriptionError: "",
    };

    let valid = true;
    const bracketsParentheses = /\[[^\]]*\]\([^)]*\)/g;
    const empty_brackets = /\[\s*\]|\(\s*\)/g;
    const http_regex = /\(https?:\/\/[^\s)]*\)/g;


    if (bracketsParentheses.test(communityDescription)) {
      if (empty_brackets.test(communityDescription)) {
        errorMessages.communityDescriptionError = "Invalid input. Must have no empty brackets or parentheses.";
        valid = false;
      }
      else {
        if (!http_regex.test(communityDescription)) {
          errorMessages.communityDescriptionError = "Invalid input. The URL must begin with http:// or https://.";
          valid = false;
        }
      }
    }

    if (communityName.length === 0) {
      errorMessages.communityNameError = "Community name is required.";
      valid = false;
    } else if (communityName.length > 100) {
      errorMessages.communityNameError = "Community name exceeds maximum character count.";
      valid = false;
    } else if (communities.some(comm => comm.name === communityName && community.name !== comm.name)) {
      errorMessages.communityNameError = "Community name already exists.";
      valid = false;
    }

    if (communityDescription.length === 0) {
      errorMessages.communityDescriptionError = "Community description is required.";
      valid = false;
    } else if (communityDescription.length > 500) {
      errorMessages.communityDescriptionError = "Community description exceeds maximum character count.";
      valid = false;
    }


    if (!valid) {
      setError(errorMessages);
      return false;
    }

    // addNewCommunity({communityName, communityDescription, communityCreator});
    axios.patch(`http://localhost:8000/editCommunity/${community._id}`, { 
      name: communityName,
      description: communityDescription,
    }).then(res => {
      handleCommunitySelect(res.data)
      console.log(res)
    }).catch(err => {
      errorMessages.serverError = "Server error. Please try again later. Click on Phreddit logo at the top to return to the welcome page.";
      setError(errorMessages);
      console.error(err)
    });
  };

  return (
    <div id="community-post-container">
      <div class="post-heading">{`Editing: ${community.name}`} </div>
      <div id="create-community">
        <div className="new-community-name">
          <label htmlFor="new-community-name">
            Community Name (required, 100 characters max):
          </label>
          <textarea
            id="new-community-name"
            name="new-community-name"
            value={communityName}
            onChange={(event) => setCommunityName(event.target.value)}
          />
        </div>
        <div id="community-name-error" className="error-message">{error.communityNameError}</div>  
        <div className="new-community-description">
          <label htmlFor="new-community-description">
            Community Description (required, 500 characters max):
          </label>
          <textarea
            id="new-community-description"
            name="new-community-description"
            value={communityDescription}
            onChange={(event) => setCommunityDescription(event.target.value)}
          />
        </div>
        <div id="community-description-error" className="error-message">{error.communityDescriptionError}</div>  
        <div className="submit-new-community">
          <button id="submit-new-community" onClick={engenderCommunity}>Engender Community</button>
        </div>
        <div id="community-description-error" className="error-message">{error.serverError}</div>  
      </div>
    </div>
  );
};

export default EditCommunity;