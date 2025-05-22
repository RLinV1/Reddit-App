import React from 'react'
import Header from './Header.js'
import PostListView from './PostListView.js'
import { useState, useEffect } from 'react'
import axios from 'axios'
import LoginScreen from './LoginScreen.js'
const Phreddit = () => {

    const [resetPostView, setResetPostView] = useState(true);
    const [isCreatePostView, setIsCreatePostView] = useState(false);
    const [isSearchView, setIsSearchView] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false); //used for login/logout
    const [user, setUser] = useState("Guest"); //used for user
    const [profileView, setProfileView] = useState(false); //used for profile view
     //usestates for search since search is in header
    const [showError, setShowError] = useState(false);
    const [editUser, setEditUser] = useState(null);
  
    const handleResetPostView = () => {
        setResetPostView(true);
    }    
    const handleCreatePostView = () => {
      setIsCreatePostView(true);
    }
    const handleSearchView = () => {
      setIsSearchView(true);
    }

    useEffect(() => {
      console.log("Checking authentication status...");
      axios.get(`http://localhost:8000/auth/check`, { withCredentials: true }).then((res) => {;
        setIsAuthenticated(true);
        setUser(res.data);
        console.log("User authenticated:", res.data);
      }).catch(err => {
        setIsAuthenticated(false);
      });
    }, []);
  


    if (!isAuthenticated) {
      return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} setUser={setUser} />;
    }
    
  
    return (
      <div>
          <Header user={user} setUser={setUser} showError={showError} setEditUser={setEditUser} setProfileView={setProfileView} setIsAuthenticated={setIsAuthenticated} handleResetPostView={handleResetPostView} handleCreatePostView={handleCreatePostView} isCreatePostView={isCreatePostView} handleSearchView={handleSearchView} setSearchValue={setSearchValue}/>
          <PostListView  user={user} setEditUser={setEditUser} editUser={editUser} resetPostView={resetPostView} showError={showError} setShowError={setShowError} setProfileView={setProfileView} setIsAuthenticated={setIsAuthenticated} profileView={profileView} setResetPostView={setResetPostView} isCreatePostView={isCreatePostView} setIsCreatePostView={setIsCreatePostView} isSearchView={isSearchView} setIsSearchView={setIsSearchView} searchValue={searchValue} />
      </div>
    )
}

export default Phreddit