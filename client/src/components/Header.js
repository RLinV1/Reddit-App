import axios from "axios";
import "../css/index.css";
import React, { useState } from "react";
export default function Header({user, setUser, setEditUser, showError, handleResetPostView, handleCreatePostView, handleSearchView, setSearchValue, isCreatePostView, setIsAuthenticated, setProfileView}) {
  const [logoutError, setLogoutError] = useState("");

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      setSearchValue(event.target.value);
      handleSearchView();
    }
  };
  const logout = () => {
    axios.post(`http://localhost:8000/logout`, {}, { withCredentials: true })
    .then((res) => {  
      console.log("Logout successful");
      setIsAuthenticated(false);
      setUser("Guest");
      setLogoutError("");
    })
    .catch(err => {
      console.log(err);
      setLogoutError("Logout failed. Please try again.");


    });

  }
  
  

  return (
    <div id="main">
      <div id="header-container" className="header-container">
        <div id="header" className="header" onClick={() => {
        if (user === "Guest") {
          setIsAuthenticated(false); 
        } else {
          if (showError){
            setIsAuthenticated(false);
          } else {
            handleResetPostView();
          }
        }}}
        >
          phreddit
        </div>
        <div id="header-search-container">
          <input type="search" id="search" placeholder="Search Phreddit..."  onKeyDown={handleKeyDown}/>
        </div>
        <div id="create-post" className={`create-post ${isCreatePostView ? "active" : ""}${user === "Guest" ? "guest" : ""}`} onClick={user === "Guest" ? undefined: handleCreatePostView}>
          Create Post
        </div>
        <div className="user-info">
          <button className={`user-name ${user === "Guest" ? "guest" : ""}`}  onClick={user === "Guest" ? undefined : () => {setProfileView(true); setEditUser(null)}}>{user === "Guest" ? user: user.username}</button>
          
          {user !== "Guest" && <button className="logout-button" onClick={() => logout()}>Logout</button> }
        </div>
      </div>
      
     
      <div className="hr">
        <hr />
      </div>
      {logoutError && (
        <div className="error-container">
          {logoutError}
        </div>
      )}
      
    </div>
  );
}
