import "../css/index.css";
import React, { useEffect, useState } from "react";
export default function Navbar({user, isHomeView, isCreateCommunityView, communitySelected, handleCommunitySelect, setResetPostView, setIsCreateCommunityView, communities}){ 
  const [userCommunities, setUserCommunities] = useState([]);
  const [otherCommunities, setOtherCommunities] = useState([]);

  useEffect(() => {
    const splitCommunities = (communities) => {
      const userCommunityList = communities.filter((community) =>
        community.members.includes(user._id)
      );
      const otherCommunityList = communities.filter(
        (community) => !community.members.includes(user._id)
      );
      

      setUserCommunities(userCommunityList);
      setOtherCommunities(otherCommunityList);
    }
    if (communities) {
      splitCommunities(communities);
    }
  }, [communities, user._id]);
  
  if (!communities) {
    return (
      <div className="error-banner">
        <p>Unable to load communities</p>
        <p>Click the <strong>Phreddit logo</strong> at the top to return to the welcome page.</p>
      </div>
    );
  }



 
    
return (
  <div id="side-bar">
    <div id="home" className={`home ${isHomeView ? "active" : ""}`} onClick={() => setResetPostView(true)}>
      Home
    </div>
    <div className="hr">
      <hr />
    </div>

    <div 
      className={`community-button ${isCreateCommunityView ? "active" : ""}${user === "Guest" ? "guest" : ""}`} 
      id="new-community" 
      onClick={user === "Guest" ? undefined : () => setIsCreateCommunityView(true)}
    >
      Create Community
    </div>

    <div id="community" className="community">
      {user === "Guest" ? (
        <>
          <div className="community-title">
            {communities.length > 0 ? 'Communities' : 'No Communities Found'}
          </div>
          <div id="communities-name" className="communities">
            {communities.map((community, index) => {
              const selection = communitySelected && communitySelected._id.toString() === community._id.toString();
              return (
                <div key={index} className="community-item">
                  <div 
                    className={`community-item ${selection ? "active" : ""}`} 
                    id={community._id} 
                    onClick={() => handleCommunitySelect(community)}
                  >
                    {community.name}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {communities.length === 0 ? (
            <div className="community-title">No Communities Found</div>
          ) : (
            <>
              {userCommunities.length > 0 && <div className="community-title">Your Communities</div>}
              <div id="communities-name" className="communities">
                {userCommunities.sort((a, b) => {
                  const community1 = a.members.includes(user._id);
                  const community2 = b.members.includes(user._id);
                  if (community1 && !community2) return -1;
                  if (!community1 && community2) return 1;
                  return 0;
                }).map((community, index) => {
                  const selection = communitySelected && communitySelected._id.toString() === community._id.toString();
                  return (
                    <div key={index} className="community-item">
                      <div 
                        className={`community-item ${selection ? "active" : ""}`} 
                        id={community._id} 
                        onClick={() => handleCommunitySelect(community)}
                      >
                        {community.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {otherCommunities.length > 0 && <div className="community-title">Other Communities</div>}
          <div id="communities-name" className="communities">
            {otherCommunities.sort((a, b) => {
              const community1 = a.members.includes(user._id);
              const community2 = b.members.includes(user._id);
              if (community1 && !community2) return -1;
              if (!community1 && community2) return 1;
              return 0;
            }).map((community, index) => {
              const selection = communitySelected && communitySelected._id.toString() === community._id.toString();
              return (
                <div key={index} className="community-item">
                  <div 
                    className={`community-item ${selection ? "active" : ""}`} 
                    id={community._id} 
                    onClick={() => handleCommunitySelect(community)}
                  >
                    {community.name}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  </div>
);

}
