  import { useEffect, useState } from "react";
  import { getTimeStamp, renderHyperLink, fetchLinkFlairs, fetchCommunities, fetchReplies, fetchUsers} from "../util/util";
  import axios from "axios";
  const PostItems = ({ user, isCommunityView, postData, setPost, setIsPostView, memberPosts, nonMemberPosts }) => {

    
  
    const [communities, setCommunities] = useState({});
    const [linkFlairs, setLinkFlairs] = useState({});
    // const [comments, setComments] = useState({});
    const [commentList, setCommentList] = useState({});
    const [users, setUsers] = useState({});
    const [showError, setShowError] = useState(false);

    // useEffect(() => {
    //   const timer = setTimeout(() => setShowError(true), 3000);
    //   return () => clearTimeout(timer); 
    // }, []);
 
   
 
    useEffect(() => {

      if (postData && postData.length > 0) {
        fetchCommunities(postData).then(res => setCommunities(res)).catch(err => { setShowError(true); console.log(err)});
        
        fetchLinkFlairs(postData).then(res => {setLinkFlairs(res);}).catch(err => { setShowError(true); console.log(err)});

        for (let post of postData){   
          const replyList = []
          fetchReplies(replyList, post.commentIDs).then(res => {
            // console.log(res);
            setCommentList((prev) => ({ ...prev, [post._id]: res }));
          }).catch(err => { setShowError(true); console.log(err)});
        }
        fetchUsers(postData).then(res => setUsers(res)).catch(err => { setShowError(true); console.log(err)});

      }
      
    }, [postData, setShowError]);

  

    if (showError && !users && !communities && !postData) {
      return <div className="error-container">
        <p>Unable to load communities</p>
        <p>Click the <strong>Phreddit logo</strong> at the top to return to the welcome page.</p>
      </div>;
    }
   
    const updateViewCount = async (postID) => {
      await axios.patch(`http://localhost:8000/updateViewCount/${postID}`).catch(err => {
        setShowError(true);
        console.log(err);
      });
    };
    const renderPost = (post, index) => {
      const timeStamp = getTimeStamp(post.postedDate);
      return (
        <div
          key={index}
          className="post-item"
          onClick={() => {
            setPost(post);
            setIsPostView(true); 
            updateViewCount(post._id); 
          }}
        >
          <div className="post-item" id={post.postID}>
            {!isCommunityView && `${communities[post._id]?.name || ""} | `}
            {users[post._id]} | {timeStamp}
            <div className="post-title">{post.title}</div>
            <div className="post-link-flair">{linkFlairs[post._id] === "no link flair" ? "" : linkFlairs[post._id]}</div>
            <div className="post-content">{renderHyperLink(post.content)}</div>
            <div className="post-info">
              <div className="post-views">Views: {post.views}</div>
              <div className="post-comments">
                Comments: {commentList?.[post._id] ? Object.keys(commentList[post._id]).length : 0}
              </div>
              <div className="post-votes">Votes: {post.votes}</div>
            </div>
            <hr className="post-hr" />
          </div>
        </div>
      );
    };
    


    
    return (
      <div id="post-items">
         {(user === "Guest" || isCommunityView) ? (
          postData.map((post, index) => renderPost(post, index))
        ) : (
          <div>
            {memberPosts.length !== 0 && (
              <div className="post-section-header">Posts from your communities</div>
            )}
            {memberPosts.map((post, index) => renderPost(post, index))}

            {nonMemberPosts.length !== 0 && (
              <div className="post-section-header">Posts from other communities</div>
            )}
            {nonMemberPosts.map((post, index) => renderPost(post, index))}
          </div>
        )}
      </div>
    );
  };


  export default PostItems;
