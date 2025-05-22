import React, { useEffect } from "react";
import Navbar from "./Navbar";
import { useState, useCallback } from "react";
import PostItems from "./PostItems";
import { getTimeStamp, renderHyperLink, fetchReplies, fetchUser } from "../util/util";
import CreateCommunity from "./CreateCommunity";
import PostView from "./PostView";
import CreatePost from "./CreatePost"
import axios from "axios";
import ProfileView from "./ProfileView";
import EditPost from "./EditPost";
import EditCommunity from "./EditCommunity";
import EditComment from "./EditComment";

const PostListView = ({user, setEditUser, editUser, showError, setShowError, resetPostView, setResetPostView, isCreatePostView, setIsCreatePostView, isSearchView, setIsSearchView, searchValue, profileView, setProfileView}) => {
  const [heading, setHeading] = useState("All Posts");
  const [isCommunityView, setIsCommunityView] = useState(false);
  const [isCreateCommunityView, setIsCreateCommunityView] = useState(false); // to store create community view state
  const [isPostView, setIsPostView] = useState(false); // to store post view state
  const [post, setPost] = useState({}); // to store post data
  const [postData, setPostData] = useState([]); // have to clone to ensure immutability and for react to recognize the changes
  const [isHomeView, setIsHomeView] = useState(true);
  const [communitySelected, setCommunitySelected] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [memberPosts, setMemberPosts] = useState([]);
  const [nonMemberPosts, setNonMemberPosts] = useState([]);
  const [communitySelectedCreator, setCommunitySelectedCreator] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isEditPostView, setIsEditPostView] = useState(false);
  const [isEditCommunityView, setIsEditCommunityView] = useState(false);
  const [isEditCommentView, setIsEditCommentView] = useState(false);
  const [editComment, setEditComment] = useState({});
 
  const sortNew = useCallback(() => {
    console.log("Sort new");
    

    const sorted = [...postData].sort((a, b) => {
      
      return new Date(b.postedDate) - new Date(a.postedDate)
    } );
    setPostData(sorted);
  }, [postData])
  function sortOld() {
    console.log("Sort old");
    const sorted = [...postData].sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    setPostData(sorted);
  }
  const fetchData = useCallback(async () => {
    try {
      const posts = await axios.get("http://localhost:8000/", { withCredentials: true });
      const fetchedDataSorted = posts.data.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      setPostData(fetchedDataSorted);
    } catch (error) {
      setShowError(true);
      console.log("Error fetching post data:", error);
    }
  }, [setShowError])

  const fetchAllCommunities = useCallback(async () => {
    try {
      const communityResponse = await axios.get("http://localhost:8000/communities");
      setCommunities(communityResponse.data); 
    } catch( error){
      setShowError(true);
      console.log("Error fetching community data:", error);
    }
  }, [setShowError]);

  const setSearchView = useCallback(async (term) => {
    try {
      if (term.trim() === "") {
        return [];
      }
      const response = await axios.get(`http://localhost:8000/getPostsBySearch/${term}`);
      const posts = response.data;
      // console.log(posts);
      return posts;
    }
    catch (error) {
      setShowError(true);
      console.log("Error fetching post data:", error);
    }
  }, [setShowError]);
  const updateMemberAndNonMemberPosts = useCallback(() => {
    if (!communities || communities.length === 0) return;
  
    // console.log(data);
    const memberPostsData = postData.filter((post) => {
      return communities.some(
        (community) =>
          community.postIDs.includes(post._id) &&
          community.members.includes(user._id)
      );
    });

    // console.log("member posts", memberPostsData);
  
    const nonMemberPostsData = postData.filter((post) => {
      return communities.some(
        (community) =>
          community.postIDs.includes(post._id) &&
          !community.members.includes(user._id)
      );
    });
  
    setMemberPosts(memberPostsData);
    setNonMemberPosts(nonMemberPostsData);
  }, [communities, user, postData]);
  

  useEffect(() => {
    setIsMember(false);
    if (communitySelected !== null) {
      fetchUser(communitySelected.createdBy).then(res => setCommunitySelectedCreator(res)).catch(err => setShowError(true)); 

      if (communitySelected.members.includes(user._id)) {
        setIsMember(true);
      }
      
    }
  }, [communitySelected, user._id, setShowError]);

  useEffect(() => {
      fetchData();
      fetchAllCommunities();
  }, [fetchData, fetchAllCommunities]);

  useEffect(() => {
    console.log("Post Data updated", postData);
  }, [postData]);  // This will log every time postData is updated

  useEffect(() => {
    if (postData) {
      console.log("updating member and non member posts");
      //console.log(postData);
      updateMemberAndNonMemberPosts();
    }
  }, [postData, updateMemberAndNonMemberPosts, communities]);
  


  useEffect(() => {
    if (resetPostView) {
      const resetView = async () => {
          console.log("resetting post view");
          
          await fetchData();  
          await fetchAllCommunities(); 
  
          setIsCommunityView(false); 
          setIsCreateCommunityView(false); // reset create community view
          setIsPostView(false); // reset post view
          setResetPostView(false); // reset the state to false
          setIsCreatePostView(false);
          setIsSearchView(false);
          setIsCommunityView(false);
          setIsHomeView(true);
          setCommunitySelected(null);
          setIsMember(false);
          setProfileView(false);
          setIsEditPostView(false);
          setIsEditCommunityView(false);
          setIsEditCommentView(false);
  
          setHeading("All Posts");
      };
  
      try {
        resetView();

      } catch (error) {
        setShowError(true);
        console.log("Error resetting post view:", error);
      }
    }
  },[resetPostView, setResetPostView, setIsCreatePostView, setIsSearchView, setProfileView, fetchData, fetchAllCommunities, setShowError]);

  useEffect(() => {

    if (isCommunityView){
      setIsCreateCommunityView(false); // reset create community view
      setIsPostView(false); // reset post view
      setIsCreatePostView(false);
      setIsSearchView(false);
      setIsHomeView(false);
      setProfileView(false);
      setIsEditPostView(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
    }
  }, [isCommunityView, setIsCreatePostView, setIsSearchView, setProfileView]);

  useEffect(() => {
    if (isCreateCommunityView){
      setIsCommunityView(false); // reset community view
      setIsPostView(false); // reset post view
      setIsCreatePostView(false);
      setIsSearchView(false);
      setIsHomeView(false);
      setCommunitySelected(null);
      setIsMember(false);
      setProfileView(false);
      setIsEditPostView(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
    }
  }, [isCreateCommunityView, setIsCreatePostView, setIsSearchView, setProfileView]);
  

  useEffect(() => {
    if (isPostView){
      setIsCommunityView(false); // reset community view
      setIsCreateCommunityView(false); // reset create community view
      setIsCreatePostView(false);
      setIsSearchView(false);
      setCommunitySelected(null);
      setIsMember(false);
      setIsHomeView(false);
      setProfileView(false);
      setIsEditPostView(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
    }
  }, [isPostView, setIsCreatePostView, setIsSearchView, setProfileView]);

  useEffect(() => {
    if (isCreatePostView){
      setIsPostView(false); // reset post view
      setIsCommunityView(false); // reset community view
      setIsCreateCommunityView(false); // reset create community view
      setIsSearchView(false);
      setCommunitySelected(null);
      setIsHomeView(false);
      setIsMember(false);
      setProfileView(false);
      setIsEditPostView(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
    }
  }, [isCreatePostView, setIsSearchView, setProfileView])

  useEffect(() => {
    if(isSearchView){
      const setSearch = async () => {
        try {
          const data = await setSearchView(searchValue);
          setPostData(data);
        }
        catch (error) {
          console.error("Error fetching search data:", error);
        }
      }

      setSearch();
      setIsPostView(false);
      setIsCommunityView(false); // reset community view
      setIsCreateCommunityView(false); // reset create community view
      setIsCreatePostView(false);
      setCommunitySelected(null);
      setIsHomeView(false);
      setIsMember(false);
      setProfileView(false);
      setIsEditPostView(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
    }
  }, [isSearchView, setIsCreatePostView, searchValue, setProfileView, setSearchView])

  useEffect(() => { 
    if (profileView) {
      setIsPostView(false); 
      setIsCommunityView(false); 
      setIsCreateCommunityView(false);
      setIsCreatePostView(false);
      setIsSearchView(false);
      setCommunitySelected(null);
      setIsHomeView(false);
      setIsMember(false);
      setIsEditPostView(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
    }
  }, [profileView, setIsCreatePostView, setProfileView, setIsSearchView]);
  
  useEffect(() => {
    if (isEditPostView){
      setIsPostView(false); 
      setIsCommunityView(false); 
      setIsCreateCommunityView(false);
      setIsCreatePostView(false);
      setIsSearchView(false);
      setCommunitySelected(null);
      setIsHomeView(false);
      setIsMember(false);
      setIsEditCommunityView(false);
      setIsEditCommentView(false);
      setProfileView(false);
    }
  }, [isEditPostView, setIsCreatePostView, setProfileView, setIsSearchView])


  
  useEffect(() => {
    if (isEditCommunityView){
      setIsPostView(false); 
      setIsCommunityView(false); 
      setIsCreateCommunityView(false);
      setIsCreatePostView(false);
      setIsSearchView(false);
      setIsHomeView(false);
      setIsMember(false);
      setProfileView(false);
      setIsEditCommentView(false);
      setIsEditPostView(false);
    }
  }, [isEditCommunityView, setIsCreatePostView, setProfileView, setIsSearchView])

  useEffect(() => {
    if (isEditCommentView){
      setIsPostView(false); 
      setIsCommunityView(false); 
      setIsCreateCommunityView(false);
      setIsCreatePostView(false);
      setIsSearchView(false);
      setCommunitySelected(null);
      setIsHomeView(false);
      setIsMember(false);
      setProfileView(false);
      setIsEditCommunityView(false);
      setIsEditPostView(false);
    }
  }, [isEditCommentView, setIsCreatePostView, setProfileView, setIsSearchView])
  

  // Later on postData should change based on community selected, search results, etc.
   async function sortActive() {
    console.log("sort active");
  

    const data = await Promise.all(
      postData.map(async (post) => {
        try {
          const post1AllComments = await fetchReplies([], post.commentIDs);
          // If no comments, fallback to post.postedDate
          let recentCommentedDate = new Date(post.postedDate);
          if (post1AllComments.length > 0) {
            post1AllComments.sort(
              (a, b) => new Date(b.commentedDate) - new Date(a.commentedDate)
            );
            recentCommentedDate = new Date(post1AllComments[0].commentedDate);
          }
      
          return { ...post, recentCommentedDate };
        } catch(err){
          setShowError(true);
          console.log(err);
        }    
        
      })
    );

    const sorted = data.sort((post1, post2) => 
    {
      if (post1.commentIDs.length === 0 && post2.commentIDs.length === 0) {
        return new Date(post2.postedDate) - new Date(post1.postedDate);
      }
      if (post1.commentIDs.length === 0 && post2.recentCommentedDate) {
        return new Date(post2.recentCommentedDate) - new Date(post1.postedDate);
      }
      if (post2.commentIDs.length === 0 && post1.recentCommentedDate) {
        return new Date(post2.postedDate) - new Date(post1.recentCommentedDate);
      }
      return post2.recentCommentedDate - post1.recentCommentedDate
    })
    setPostData(sorted);
    
  }

  const fetchCommunityData = async (selectedCommunity) => {
    try {
      const response = await axios.get(`http://localhost:8000/getCommunityByID/${selectedCommunity._id}`);
      const community = response.data;
      setCommunitySelected(community);
      //console.log(selectedCommunity);
      
      const postsResponse = await axios.get("http://localhost:8000/");
      const posts = postsResponse.data;
      const postData = posts.filter((post) => community.postIDs.some((postID) => 
          postID.toString() === post._id.toString()
        )
      );
      setPostData(postData.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate)));
    }
    catch (error) {
      setShowError(true);
      console.log("Error fetching post data:", error);
    }
  }

  function handleCommunitySelect(community) {
    // console.log(community);
    try {
      fetchAllCommunities();
      setHeading(community.name);
      setCommunitySelected(community);
      fetchCommunityData(community);
      
      setIsCommunityView(true);
      setIsCreateCommunityView(false);
      setIsCreatePostView(false);
    }
    catch (error) {
      console.log(error);
      setShowError(true);
    }
  }
 
  if (showError){
    return <div className="error-container">
      <p>Unable to load data</p>
      <p>Click the <strong>Phreddit logo</strong> at the top to return to the welcome page.</p>
    </div>;
  }
  
  if (!postData || !communities) {
    return <div>Loading...</div>;
  }
  
  

  if (isPostView || isCreatePostView || isCreateCommunityView || profileView || isEditPostView || isEditCommentView || isEditCommunityView) {
    return (
      <div id="posts-view">
         <Navbar user={user} communities={communities} isHomeView={isHomeView} communitySelected={communitySelected} isCreateCommunityView={isCreateCommunityView} handleCommunitySelect={handleCommunitySelect} setResetPostView={setResetPostView} setIsCreateCommunityView={setIsCreateCommunityView}/>
         <div className="vr"></div>
         <div className="posts-area">
            {isPostView &&  <PostView user={user} postID={post._id}/>}
            {isCreatePostView && <CreatePost user={user} setResetPostView={setResetPostView}/>}
            {isCreateCommunityView && <CreateCommunity user={user} handleCommunitySelect={handleCommunitySelect} communities={communities}/>}
            {isEditPostView && <EditPost user={user} setResetPostView={setResetPostView} post={post}/>}
            {isEditCommunityView && <EditCommunity user={user} handleCommunitySelect={handleCommunitySelect} communities={communities} community={communitySelected}/>}
            {isEditCommentView && <EditComment user={user} editComment={editComment} setProfileView={setProfileView}/>}
            {profileView && <ProfileView currentUser={user} setEditUser={setEditUser} editUser={editUser} setResetPostView={setResetPostView} setPost={setPost} setIsEditPostView={setIsEditPostView} setIsCreatePostView={setIsCreatePostView} setIsCommunityView={setIsCommunityView} setIsCreateCommunityView={setIsCreateCommunityView} setIsSearchView={setIsSearchView} setHeading={setHeading} setCommunities={setCommunities} setUser={user} postData={postData} memberPosts={memberPosts} nonMemberPosts={nonMemberPosts} communitySelected={communitySelected}
              setCommunitySelected={setCommunitySelected} setIsEditCommunityView={setIsEditCommunityView} setEditComment={setEditComment} setIsEditCommentView={setIsEditCommentView} fetchAllCommunities={fetchAllCommunities} />}
         </div>
      </div>
    )
  }



  
  const joinOrLeaveCommunity = () => {
    if (isMember) {
      setIsMember(false);
      axios.patch(`http://localhost:8000/deleteCommunityMember/${communitySelected._id}`, { userID: user._id }).then(res => {
        console.log("Deleted member");
        fetchAllCommunities();
        axios.get(`http://localhost:8000/getCommunityByID/${communitySelected._id}`).then(res => {
          const community = res.data;
          setCommunitySelected(community);
        }).catch(err => { setShowError(true); console.log(err)});
        
      }).catch(err => { setShowError(true); console.log(err)});
    } else {
      setIsMember(true);
      axios.patch(`http://localhost:8000/addCommunityMember/${communitySelected._id}`, { userID: user._id }).then(res => {
        console.log("Added member");
        fetchAllCommunities();
        axios.get(`http://localhost:8000/getCommunityByID/${communitySelected._id}`).then(res => {
          const community = res.data;
          setCommunitySelected(community);
        }).catch(err => { setShowError(true); console.log(err)});

      }).catch(err => { setShowError(true); console.log(err)});
    }
  }

  return (
    <div id="posts-view">
      <Navbar user={user} communities={communities} isHomeView={isHomeView} isCreateCommunityView={isCreateCommunityView} communitySelected={communitySelected} handleCommunitySelect={handleCommunitySelect} setResetPostView={setResetPostView} setIsCreateCommunityView={setIsCreateCommunityView}/>

      <div className="vr"></div>
      <div className="posts-area">
        <div class="posts-header">
          {!isCommunityView && !isSearchView ? (
              <div className="all-posts">{heading}</div>
            ) : isSearchView ? (
              <div id="search-container">
                  <div class="search-container-title">{postData && postData.length > 0 ? `Results For: ${searchValue}` : `No Results Found For: ${searchValue}` }</div>
              </div>
            ) : (
              <div id="community-post-container">
                <div id="community-info">
                  
                  <div id="community-name">{communitySelected.name}</div>
                  <div id="community-description">{renderHyperLink(communitySelected.description)}</div>
                  <div id="community-start-date">
                    {getTimeStamp(communitySelected.startDate)} | {" "}
                    {communitySelectedCreator ? communitySelectedCreator.username : ""} 
                  </div>
                  <div id="community-member-count">
                    {user === "Guest" ? postData.length + " posts" : (memberPosts.length + nonMemberPosts.length) + " posts"} | {communitySelected.memberCount} members
                  </div>
                  {user !== "Guest" && (
                      <div id="community-join-or-leave"> 
                        <button className="community-join-or-leave-button" onClick={joinOrLeaveCommunity}>{!isMember ? "Join" : "Leave"}</button> 
                      </div>
                    )}
                </div>
              </div>
            )}
          <div id="sort-container">
            <div class="sort-buttons" id="sort-new" onClick={sortNew}>
              Newest
            </div>
            <div class="sort-buttons" id="sort-old" onClick={sortOld}>
              Oldest
            </div>
            <div class="sort-buttons" id="sort-active" onClick={sortActive}>
              Active
            </div>
          </div>
        </div>

        <div style={{ marginRight: "15px"}}>
          <hr />
        </div>

        <div id="posts-list" class="posts-list">
          <div id="post-number">{!isCommunityView && postData && (postData.length === 0  ? `No posts` : `${postData.length} posts`)}</div>
          <div id="post-items">
            <PostItems user={user} isCommunityView={isCommunityView} postData={postData} memberPosts={memberPosts} nonMemberPosts={nonMemberPosts} setPost={setPost} setIsPostView={setIsPostView}/>
          </div>
        </div>
      </div>
    </div>
  );
};


export default PostListView;