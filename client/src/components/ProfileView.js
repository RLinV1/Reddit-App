import React, { useEffect, useState } from "react";
import { getTimeStamp, fetchReplies, } from "../util/util";
import axios from "axios";

const ProfileView = ({ currentUser, editUser, setEditUser, setResetPostView, setIsEditPostView, setPost, setCommunitySelected, setIsEditCommunityView, setEditComment, setIsEditCommentView, fetchAllCommunities }) => {
  const [showError, setShowError] = useState(false);
  const [user, setUser] = useState("");
  const [userList, setUserList] = useState([]);
  const [selectedSection, setSelectedSection] = useState("posts");
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [commentPostTitles, setCommentPostTitles] = useState({});
  const [deleteCommentList, setDeleteCommentList] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemID, setDeleteItemID] = useState(null); 
  const [deleteType, setDeleteType] = useState('');  


  


  useEffect(() => {
    if (userComments){
      fetchPostTitle(userComments);
    }
  }, [userComments]);

  useEffect(() => {
    //console.log(deleteCommentList); 
  }, [deleteCommentList]); 

  const showDeletePopup = async(deleteID, deleteType) => {
    setShowDeleteConfirm(true);
    setDeleteItemID(deleteID);
    setDeleteType(deleteType);
    console.log(deleteID);
  }

  const handleConfirmDelete = async () => {
    try {
      if (deleteItemID && deleteType === 'comment') {
        await deleteComment(deleteItemID); 
      }
      else if (deleteItemID && deleteType === 'post') {
        await deletePost(deleteItemID);
      }
      else if (deleteItemID && deleteType === 'community') {
        await deleteCommunity(deleteItemID);
      }
      else if (deleteItemID && deleteType === 'user') {
        await deleteUser(deleteItemID);
      }
      setResetPostView(true);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting item:", error);
      setShowError(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const deleteComment = async (commentID) => {
    console.log(commentID);
    try {
      const comments = [];
      const replyData = await fetchReplies(comments, commentID);
      setDeleteCommentList(replyData);
      console.log(replyData);
      const data = { commentIDs: replyData }
      await axios.delete(`http://localhost:8000/deleteComment/${commentID}`, { data: data });
    } catch (error) {
      setShowError(true);
      console.log(error);
    }
  }

  const deletePost = async (postID) => {
    try {
      await axios.delete(`http://localhost:8000/deletePost/${postID}`);
    }
    catch (error) {
      setShowError(true);
      console.log(error);
    }
  }

  const deleteCommunity = async (communityID) => {
    try {
      const communityResponse = await axios.get(`http://localhost:8000/getPostsByCommunity/${communityID}`);
      const postIDs = communityResponse.data;
      for (let postID of postIDs) {
        await axios.delete(`http://localhost:8000/deletePost/${postID}`);
      }
      await axios.delete(`http://localhost:8000/deleteCommunity/${communityID}`);
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  const deleteUser = async (userItemID) => {
    try {
      const communityResponse = await axios.get(`http://localhost:8000/getCommunities/${userItemID}`); 
      const communities = communityResponse.data;

      const postResponse = await axios.get(`http://localhost:8000/getUserPosts/${userItemID}`);
      const posts = postResponse.data;

      const commentResponse = await axios.get(`http://localhost:8000/getUserComments/${userItemID}`);
      const comments = commentResponse.data;
      for (let comment of comments) {
        await deleteComment([comment._id]);
      }
      for (let post of posts) {
        await deletePost(post._id);
      }
      for (let community of communities) {
        await deleteCommunity(community._id);
      }
      await axios.delete(`http://localhost:8000/deleteUser/${userItemID}`);
      
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  const handleSectionClick = (section) => {
    setSelectedSection(section);
  };

  
  useEffect(() => {
    const fetchData = async () => {
        try {
 
          const newUserID = editUser ? editUser._id : currentUser._id;
          const userResponse = await axios.get(`http://localhost:8000/getUser/${newUserID}`);
          const userData = userResponse.data;
          if (userData?.isAdmin) {
            setSelectedSection("users");
          } else {
            setSelectedSection("posts");
          }
          setUser(userData);

          const postResponse = await axios.get(`http://localhost:8000/getUserPosts/${newUserID}`);
          const posts = postResponse.data;
          const sortedPosts = [...posts].sort((a, b) => {   
            return new Date(b.postedDate) - new Date(a.postedDate)
          } );
          setUserPosts(sortedPosts);

          const communityResponse = await axios.get(`http://localhost:8000/getCommunities/${newUserID}`); 
          const communities = communityResponse.data;
          const sortedCommunities = [...communities].sort((a, b) => {   
            return new Date(b.startDate) - new Date(a.startDate)
          } );
          setUserCommunities(sortedCommunities);

          const commentResponse = await axios.get(`http://localhost:8000/getUserComments/${newUserID}`);
          const comments = commentResponse.data;
          const sortedComments = [...comments].sort((a, b) => {   
            return new Date(b.commentedDate) - new Date(a.commentedDate)
          } );
          console.log(sortedComments);
          setUserComments(sortedComments);

          if (userData.isAdmin) {
            const usersResponse = await axios.get(`http://localhost:8000/getAllUsers`);
            const userList = usersResponse.data;
            const filteredUserList = userList.filter(u => u._id.toString() !== userData._id.toString());
            console.log(filteredUserList);
            setUserList(filteredUserList);
          }

          // if (userPosts.length > 0) {
          //   fetchCommunities(sortedPosts).then(res => setCommunities(res)).catch(err => { setShowError(true); console.log(err)});

          // }
        } catch (error) {
          console.log(error);
          setShowError(true);
        }
      };
    fetchData();
  }, [editUser, currentUser]);
  
  const renderUser = (userItem, index) => {
    try {
      const timeStamp = getTimeStamp(userItem.createdDate);
      return (
        <div
          key={index}
          className="profile-user-item"
          onClick={() => {
            setEditUser(userItem);
          }}
        >
          <div className="profile-item" id={userItem._id}>
            <div class="edit-details">
              <div>Account created {timeStamp}</div>
              <div className="post-title">{userItem.username}</div>
            </div>
            <button
            className="delete-button"
            onClick={(event) => {
              event.stopPropagation(); 
              showDeletePopup(userItem._id, 'user');
            }}
          >
            Delete
          </button>
          </div>
          <hr className="post-hr" />
        </div>
      );
    } catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  const renderPost = (post, index) => {
    try {
      const timeStamp = getTimeStamp(post.postedDate);
      return (
        <div
          key={index}
          className="profile-post-item"
          onClick={() => {
            setPost(post);
            setIsEditPostView(true); 
          }}
        >
          <div className="profile-item" id={post.postID}>
            <div class="edit-details">
              <div>Posted {timeStamp}</div>
              <div className="post-title">{post.title}</div>
            </div>
            <button
            className="delete-button"
            onClick={(event) => {
              event.stopPropagation(); 
              console.log(post);
              showDeletePopup(post._id, 'post');
            }}
          >
            Delete
          </button>
          </div>
          <hr className="post-hr" />
        </div>
      );
    } catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  const renderCommunity = (community, index) => {
    try {
      const timeStamp = getTimeStamp(community.startDate);
      return (
        <div 
        key={index}
        className="profile-community-item"
        onClick={() => {
          setCommunitySelected(community);
          setIsEditCommunityView(true);
        }}
        >
          <div className="profile-item" id={community._id}>
            <div class="edit-details">
              <div>Created {timeStamp}</div>
              <div className="community-name">{community.name}</div>
            </div>
            <button
            className="delete-button"
            onClick={(event) => {
              event.stopPropagation(); 
              showDeletePopup(community._id, 'community');
            }}
          >
            Delete
          </button>
          </div>
          <hr className="post-hr" />
        </div>
      )
    } catch (error) {
      console.log(error);
      setShowError(true);
    }

  }

  const renderComment = (comment, index) => {
    try {
      const timeStamp = getTimeStamp(comment.commentedDate);

      return (
        <div 
        key={index}
        className="profile-comment-item"
        onClick={() => {
          setEditComment(comment);
          setIsEditCommentView(true);
        }}
        >
          <div>Commented {timeStamp}</div>
          <div className="profile-item" id={comment._id}>
            <div class="edit-details">
              <div className="post-title">{commentPostTitles[comment._id]}</div>
              <div className="profile-comment-content">{comment.content}</div>
            </div>
            <button
              className="delete-button"
              onClick={(event) => {
                event.stopPropagation(); 
                showDeletePopup([comment._id], 'comment');
              }}
            >
              Delete
            </button>
          </div>
          <hr className="post-hr" />
        </div>
      )
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  const fetchPostTitle = async (userComments) => {
    try {
      const tempTitles = {};
      for (let comment of userComments){
        const response = await axios.get(`http://localhost:8000/getPost/${comment.postID}`);
        if (response) {
          const tempPost = response.data;
          tempTitles[comment._id] = tempPost.title;
        }
      }
      setCommentPostTitles(tempTitles);
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }
  }

  const renderContent = () => {
    switch (selectedSection) {
      case "users" :
        return (
          <div id="post-items">
            {(editUser?.isAdmin || user.isAdmin) && userList.map((userItem, index) => renderUser(userItem, index))}
          </div>
        );
      case "posts":
        return (        
          <div id="post-items">
            {userPosts.map((post, index) => renderPost(post, index))}
          </div>
        );
      case "community":
        return (        
          <div id="post-items">
            {userCommunities.map((community, index) => renderCommunity(community, index))}
          </div>
        );
      case "comments":
        return (
          <div id="post-items">
            {userComments.map((comment, index) => renderComment(comment, index))}
          </div>
        );
      default:
        return <div>Select a section</div>;
    }
  }

  if (showError) {
    return (
      <div className="error-container">
        <p>Click the <strong>Phreddit logo</strong> at the top to return to the welcome page.</p>
      </div>
    );
  }

 

  return (
    <div>
      <div>
        <h1 className="profile-username">{editUser ? editUser.username : user.username}</h1>
        <div style={{ marginRight: "15px" }}>
          <hr />
        </div>
        <div className="user-details">
          <p>Email: {editUser ? editUser.email : user.email}</p>
          <p>Reputation: {editUser ? editUser.reputation : user.reputation}</p>
          <p>Member Since: {editUser ? new Date(editUser.createdDate).toLocaleDateString() : new Date(user.createdDate).toLocaleDateString()}</p>
        </div>
        <div style={{ marginRight: "15px" }}>
          <hr />
        </div>
        <div class="profile-edit-section-text">Edit Your Communities, Posts, or Comments</div>

        <div className="profile-nav">
          {(editUser?.isAdmin || user.isAdmin) && (
            <button
              onClick={() => handleSectionClick("users")}
              className={selectedSection === "users" ? "profile-buttons active" : "profile-buttons"}
            >
              Users
            </button>
          )}
           <button onClick={() => handleSectionClick("posts")} className={selectedSection === "posts" ? "profile-buttons active" : "profile-buttons"}>My Posts</button>
          <button onClick={() => handleSectionClick("community")} className={selectedSection === "community" ? "profile-buttons active" : "profile-buttons"}>My Communities</button>
          <button onClick={() => handleSectionClick("comments")} className={selectedSection === "comments" ? "profile-buttons active" : "profile-buttons"}>My Comments</button>
        </div>
        <div class="profile-divider">
          <hr />
        </div>

        <div class="edit-section">
          <div className="profile-section-content">
            {renderContent()}
          </div>
        </div>
      {showDeleteConfirm && (
        <div className="confirmation-popup">
          <div className="popup-content">
            <p>Are you sure you want to delete this item?</p>
            <button class="yes-button" onClick={handleConfirmDelete}>Yes</button>
            <button class="no-button" onClick={handleCancelDelete}>No</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default ProfileView;