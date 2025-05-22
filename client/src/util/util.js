import axios from "axios";
export function getTimeStamp(postedTime) {
  const todayDate = new Date();
  // console.log(todayDate);

  let postedDate = new Date(postedTime);
  let timeStamp = "";
  // This mean the day is the same
  if (
    todayDate.getDate() === postedDate.getDate() &&
    todayDate.getMonth() === postedDate.getMonth() &&
    todayDate.getFullYear() === postedDate.getFullYear()
  ) {
    if (
      todayDate.getHours() === postedDate.getHours() &&
      todayDate.getMinutes() === postedDate.getMinutes()
    ) {
      timeStamp =
        todayDate.getSeconds() - postedDate.getSeconds() + " seconds ago";
    } else if (todayDate.getHours() === postedDate.getHours()) {
      timeStamp =
        todayDate.getMinutes() - postedDate.getMinutes() + " minutes ago";
    } else {
      timeStamp = todayDate.getHours() - postedDate.getHours() + " hours ago";
    }
  } else if (todayDate.getFullYear() === postedDate.getFullYear()) {
    
    timeStamp = todayDate.getMonth() - postedDate.getMonth() + " months ago";
  }

  if (todayDate.getFullYear() !== postedDate.getFullYear()) {
    const totalMonthsDiff = (todayDate.getFullYear() - postedDate.getFullYear()) * 12 + (todayDate.getMonth() - postedDate.getMonth());
    if (totalMonthsDiff >= 12) {
      timeStamp =
      todayDate.getFullYear() - postedDate.getFullYear() + " years ago";
    }
    else if (totalMonthsDiff > 0) {
      timeStamp = totalMonthsDiff + " months ago";
    }
  }
  return timeStamp;
}

export const getCommunityName = async (postID) => {
  const response = await axios.get(`http://localhost:8000/getCommunity/${postID}`);
  const community = response.data;
  return community.name;

}

export const fetchCommunities = async (postData) => {
  const communityNames = {}

  for (let post of postData) {
    const response = await axios.get(`http://localhost:8000/getCommunity/${post._id}`);
    const community = response.data;
    communityNames[post._id] = community;
  }
  return communityNames;
  
}

export const fetchUsers = async (postData) => {
  const usernames = {}

  for (let post of postData) {
    const response = await axios.get(`http://localhost:8000/getUser/${post.postedBy}`);
    const user = response.data;
    usernames[post._id] = user.username;
  }
  return usernames;
  
}
export const fetchUser = async (userID) => {

  const response = await axios.get(`http://localhost:8000/getUser/${userID}`);
  const user = response.data;
  return user;
}

export const fetchLinkFlairs = async (postData) => {
  const linkFlairs = {}  
  for (let post of postData){
    if (post.linkFlairID){

      const response = await axios.get(`http://localhost:8000/getLinkFlair/${post.linkFlairID}`);
      const linkFlair = response.data;
      linkFlairs[post._id] = linkFlair.content;
    } else {
 
      linkFlairs[post._id] = "";
    }

  };
  return linkFlairs;
  
}
// export all the comments for each post on the first level
export const fetchCommentsByPostID = async (postID) => {

  const response = await axios.get(`http://localhost:8000/getComments/${postID}`);
  const postComments = response.data;
  return postComments;
}
// fetch all the replies for each comment 
export const fetchReplies = async (replyList, comments) => {
  for (let commentID of comments) {
    const response = await axios.get(`http://localhost:8000/getReplies/${commentID}`);
    const commentReplies = response.data;
    // console.log(replyList)
    replyList.push(commentReplies);
    if (commentReplies && commentReplies.commentIDs && commentReplies.commentIDs.length !== 0){
      await fetchReplies(replyList, commentReplies.commentIDs);
    }
  }
  return replyList;
}
export const fetchRepliesUsernames = async (replyList) => {
  const usernames = {}
  for (let comment of replyList) {
    //console.log(comment); 
    const response = await axios.get(`http://localhost:8000/getUser/${comment.commentedBy}`);
    const user = response.data;
    usernames[comment.commentedBy] = user.username;
  }
  return usernames;
}

export const getLinkFlair = async (linkFlairID) => {
  const response =  await axios.get(`http://localhost:8000/getLinkFlair/${linkFlairID}`)
  const linkFlair = response.data;
  //console.log(linkFlair)
  return linkFlair.content;
}

export const renderHyperLink = (content) => {
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const link = [];
  let index = 0;
  // if (!content){
  //   return;
  // }

  content.replace(re, (match, text, url, offset) => {
    link.push(content.substring(index, offset));
    link.push(
      <a href={url} target="_blank" rel="noreferrer">
        {text}
      </a>
    );

    index = offset + match.length;
  });
  link.push(content.substring(index));
  return link;
};

export const getPostVoteState = async (userID, postID) => {
  const response = await axios.get(`http://localhost:8000/getVotes/${userID}`);
  //console.log("hello");
  if (response !== null) {
    const votes = response.data;
    for (let v of votes) {
      if (v.post && v.post.toString() === postID) {
        //console.log(v);
        return v.vote;
      }
    }
  }
  return null;
}

export const getCommentVoteList = async (userID, commentList) => {
  const response = await axios.get(`http://localhost:8000/getVotes/${userID}`);
  if (response !== null) {
    const votes = response.data;
    //console.log(votes);
    const updatedCommentList = commentList.map((comment) => {
      const userVote = votes.find(vote => vote.comment !== null && vote.comment.toString() === comment._id.toString());
      //console.log(userVote);
      if (userVote) {
        return userVote;
      }
      return undefined;
    }).filter(vote => vote !== undefined);
    //console.log(updatedCommentList);
    return updatedCommentList;
  }
  return null;
}
