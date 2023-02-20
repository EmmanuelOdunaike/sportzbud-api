import { fs } from "file-system";
import jwt from "jsonwebtoken";
import { upload } from "../index.js";
import prisma from "../prisma/prisma.js";
import { createError } from "../utils/error.js";
import bcrypt from "bcryptjs";
import path from "path";
// @route GET api/auth/user/me
export const getUser = async (req, res, next) => {
  console.log(req.user.id);
  const { id } = req.user;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Send Friend Request
export const sendFriendRequest = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }
    const friendRequest = await prisma.friendRequests.create({
      data: {
        senderId: parseInt(userId),
        receiverId: parseInt(id),
      },
    });
    return res.status(200).json({ friendRequest });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to accept friend request
export const acceptFriendRequest = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    const friendRequest = await prisma.friendRequests.findFirst({
      where: {
        senderId: parseInt(id),
        receiverId: parseInt(userId),
      },
    });
    if (!friendRequest) {
      return res.status(400).json({ error: "Friend request does not exist" });
    }
    const deletedFriendRequest = await prisma.friendRequests.delete({
      where: {
        id: friendRequest.id,
      },
    });
    const friend = await prisma.usersFriends.createMany({
      data: [
        {
          userId: parseInt(userId),
          friendId: parseInt(id),
        },
        {
          userId: parseInt(id),
          friendId: parseInt(userId),
        },
      ],
    });

    return res.status(200).json({ friend });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const cancelFriendRequest = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    const friendRequest = await prisma.friendRequests.findFirst({
      where: {
        senderId: parseInt(userId),
        receiverId: parseInt(id),
      },
    });
    if (!friendRequest) {
      return res.status(400).json({ error: "Friend request does not exist" });
    }
    const deletedFriendRequest = await prisma.friendRequests.delete({
      where: {
        id: friendRequest.id,
      },
    });
    return res.status(200).json({ deletedFriendRequest });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to decline friend request
export const declineFriendRequest = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const friendRequest = await prisma.friendRequests.findFirst({
      where: {
        senderId: parseInt(id),
        receiverId: parseInt(userId),
      },
    });
    if (!friendRequest) {
      return res.status(400).json({ error: "Friend request does not exist" });
    }
    const deletedFriendRequest = await prisma.friendRequests.delete({
      where: {
        id: friendRequest.id,
      },
    });
    return res.status(200).json({ deletedFriendRequest });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to get friends
export const getFriendList = async (req, res, next) => {
  const { page, limit, userId, friendsSearch } = req.query;
  console.log(userId);
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;

  try {
    if (friendsSearch) {
      const friends = await prisma.usersFriends.findMany({
        where: {
          userId: parseInt(userId),
          friend: {
            OR: [
              {
                firstName: {
                  contains: friendsSearch,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: friendsSearch,
                  mode: "insensitive",
                },
              },
              {
                fullName: {
                  contains: friendsSearch,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
        select: {
          friend: {
            select: {
              firstName: true,
              lastName: true,
              profilePicture: true,
              id: true,
              sports: {
                select: {
                  sport: true,
                },
              },
              dob: true,
            },
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });
      console.log(friends);
      return res.status(200).json({ friends });
    }

    const friends = await prisma.usersFriends.findMany({
      where: {
        userId: parseInt(userId),
      },
      select: {
        friend: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            id: true,
            sports: {
              select: {
                sport: true,
              },
            },
            dob: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });
    console.log(friends);
    return res.status(200).json({ friends });
  } catch (error) {
    console.log("error:", error);
    return res.status(400).json({ error: error.message });
  }
};

// Route to get friend requests
export const getFriendRequests = async (req, res, next) => {
  const { userId } = req.user;
  const friendRequests = await prisma.friendRequests.findMany({
    where: {
      receiverId: userId,
    },
    include: {
      sender: true,
    },
  });
  return res.status(200).json({ friendRequests });
};

// Route to get sent friend requests
export const getSentFriendRequests = async (req, res, next) => {
  const { userId } = req.user;
  const sentFriendRequests = await prisma.friendRequests.findMany({
    where: {
      senderId: userId,
    },
    include: {
      receiver: true,
    },
  });
  return res.status(200).json({ sentFriendRequests });
};

// Route to delete friend
export const deleteFriend = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    const friend = await prisma.usersFriends.findFirst({
      where: {
        userId: parseInt(userId),
        friendId: parseInt(id),
      },
    });

    if (!friend) {
      return res.status(400).json({ error: "Friend does not exist" });
    }

    const deletedFriend = await prisma.usersFriends.deleteMany({
      where: {
        OR: [
          {
            userId: parseInt(userId),
            friendId: parseInt(id),
          },
          {
            userId: parseInt(id),
            friendId: parseInt(userId),
          },
        ],
      },
    });

    return res.status(200).json({ deletedFriend });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to get all friend requests sent

export const getFriendRequestsSent = async (req, res, next) => {
  const { userId } = req.user;
  const friendRequests = await prisma.friendRequests.findMany({
    where: {
      senderId: userId,
    },
    include: {
      receiver: true,
    },
  });
  return res.status(200).json({ friendRequests });
};

// Route to get all friend requests received
export const getFriendRequestsReceived = async (req, res, next) => {
  const { userId } = req.user;
  const friendRequests = await prisma.friendRequests.findMany({
    where: {
      receiverId: userId,
    },
    include: {
      sender: true,
    },
  });
  return res.status(200).json({ friendRequests });
};

// Route to get a friend request
export const getFriendRequest = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  const friendRequest = await prisma.friendRequests.findUnique({
    where: {
      id,
    },
    include: {
      sender: true,
      receiver: true,
    },
  });
  return res.status(200).json({ friendRequest });
};

// // Route to delete a friend request
// export const deleteFriendRequest = async (req, res, next) => {
//   const { id } = req.params;
//   const { userId } = req.user;
//   const friendRequest = await prisma.friendRequests.findUnique({
//     where: {
//       id,
//     },
//   });
//   if (!friendRequest) {
//     throw createError("Friend request does not exist", 400);
//   }
//   const deletedFriendRequest = await prisma.friendRequest.delete({
//     where: {
//       id,
//     },
//   });
//   return res.status(200).json({ deletedFriendRequest });
// };

// Route to get all friend requests sent by a user
export const getFriendRequestSent = async (req, res, next) => {
  const { id } = req.user;
  try {
    const friendRequest = await prisma.friendRequests.findMany({
      where: {
        senderId: parseInt(id),
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
    return res.status(200).json({ friendRequest });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
export const hasFriendRequest = async (req, res, next) => {
  const { id } = req.user;
  try {
    const hasFriendRequest = await prisma.friendRequests.findFirst({
      where: {
        receiverId: parseInt(id),
      },
    });
    return res
      .status(200)
      .json({ hasFriendRequest: hasFriendRequest === null ? false : true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Route to get all friend requests received by a user
export const getFriendRequestReceived = async (req, res, next) => {
  const { id } = req.user;
  const friendRequest = await prisma.friendRequests.findMany({
    where: {
      receiverId: parseInt(id),
    },
    include: {
      sender: true,
      receiver: true,
    },
  });
  return res.status(200).json({ friendRequest });
};

// Route to get all friend requests sent by a user
// export const getFriendRequestSentByUser = async (req, res, next) => {
//   const { id } = req.user;
//   const friendRequest = await prisma.friendRequests.findMany({
//     where: {
//       senderId: parseInt(id),
//     },
//     include: {
//       sender: true,
//       receiver: true,
//     },
//   });
//   return res.status(200).json({ friendRequest });

// };

// Route to get a friend request received by a user
export const getFriendRequestReceivedByUser = async (req, res, next) => {
  const { page, limit } = req.query;
  const { id } = req.user;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  try {
    const friendRequest = await prisma.friendRequests.findMany({
      where: {
        receiverId: parseInt(id),
      },
      include: {
        sender: true,
        receiver: true,
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });
    return res.status(200).json({ friendRequest });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
export const getIsFriend = async (req, res, next) => {
  let { id } = req.params;
  let { id: userId } = req.user;
  id = parseInt(id);
  userId = parseInt(userId);
  try {
    const isFriend = await prisma.usersFriends.findFirst({
      where: {
        AND: [
          {
            userId: {
              in: [id, userId],
            },
          },
          {
            friendId: {
              in: [id, userId],
            },
          },
        ],
      },
    });

    if (!isFriend) return res.status(200).json({ isFriend: false });

    return res.status(200).json({ isFriend: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
export const getIsFriendReqSent = async (req, res, next) => {
  let { id } = req.params;
  let { id: userId } = req.user;
  id = parseInt(id);
  userId = parseInt(userId);
  try {
    const isFriendReqSent = await prisma.friendRequests.findFirst({
      where: {
        AND: [
          {
            senderId: userId,
          },
          {
            receiverId: id,
          },
        ],
      },
    });

    if (!isFriendReqSent)
      return res.status(200).json({ isFriendReqSent: false });

    return res.status(200).json({ isFriendReqSent: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getIsFriendReqReceived = async (req, res, next) => {
  let { id } = req.params;
  let { id: userId } = req.user;
  id = parseInt(id);
  userId = parseInt(userId);
  try {
    const isFriendReqReceived = await prisma.friendRequests.findFirst({
      where: {
        AND: [
          {
            senderId: id,
          },
          {
            receiverId: userId,
          },
        ],
      },
    });

    if (!isFriendReqReceived)
      return res.status(200).json({ isFriendReqReceived: false });

    return res.status(200).json({ isFriendReqReceived: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to start a conversation
export const createConversation = async (req, res, next) => {
  const { id: userId } = req.user;
  const { participantId } = req.body;
  const participants = [participantId, userId];
  const isFriend = await prisma.usersFriends.findFirst({
    where: {
      AND: [
        {
          userId: {
            in: participants,
          },
        },
        {
          friendId: {
            in: participants,
          },
        },
      ],
    },
  });

  if (!isFriend) {
    return res
      .status(400)
      .json({ message: "You are not friends with this user" });
  }

  const conversation = await prisma.conversation.create({
    data: {
      users: {
        connect: participants.map((participantId) => ({
          id: participantId,
        })),
      },
    },
    select: {
      users: true,
      messages: true,
    },
  });

  return res.status(200).json({ conversation });
};

// Route to get all conversations
export const getConversationsByUser = async (req, res, next) => {
  const { id } = req.user;
  const conversations = await prisma.conversation.findMany({
    where: {
      users: {
        some: {
          id: parseInt(id),
        },
      },
    },
    include: {
      users: true,
    },
  });
  return res.status(200).json({ conversations });
};

// Route to get a conversation
export const getConversation = async (req, res, next) => {
  const { id } = req.params;
  console.log(req.params);
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      users: true,
    },
  });
  return res.status(200).json({ conversation });
};

// Route to get all messages
export const getMessagesByConversation = async (req, res, next) => {
  const { id } = req.params;
  const messages = await prisma.message.findMany({
    where: {
      conversationId: parseInt(id),
    },
    include: {
      sender: true,
    },
  });
  return res.status(200).json({ messages });
};

// Route to get all messages sent by a user
export const getMessagesByUser = async (req, res, next) => {
  const { userId } = req.user;
  const messages = await prisma.message.findMany({
    where: {
      senderId: userId,
    },
    include: {
      sender: true,
    },
  });
  return res.status(200).json({ messages });
};
export const updateUser = async (req, res, next) => {
  const { firstName, lastName, location } = req.body;
  let user;
  if (firstName === "" || lastName === "")
    return res.status(400).json({ message: "Please fill all the fields" });

  const { id } = req.user;

  try {

    if (req.file) {
      user = await prisma.user.update({
        where: {
          id: parseInt(id),
        },
        data: {
          ...req.body,
          profilePicture: req.file.path.split("public/")[1],
        },
      });
    }
    else {
      user = await prisma.user.update({
        where: {
          id: parseInt(id),
        },
        data: {
          ...req.body,
        },
      });
    }
    return res.status(200).json({ user });
  }


  catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// update user password
export const updatePassword = async (req, res, next) => {
  const { password } = req.body;
  console.log(req.body)
  const { id } = req.user;
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        password: hashedPassword,
      },
    });
    return res.status(200).json({ user });
  }
  catch (error) {
    return res.status(400).json({ error: error.message });
  }


}

// update user cover photo
export const updateUserCover = async (req, res, next) => {
  const { id } = req.user;

  console.log(req.file);

  try {
    const user = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        coverPicture: req.file.path.split("public/")[1],
      },
    });

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to send a message
export const sendMessage = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const { message } = req.body;
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!conversation) {
    return res.status(400).json({ message: "Conversation not found" });
  }
  const newMessage = await prisma.message.create({
    data: {
      content: message,
      senderId: parseInt(userId),
      conversationId: parseInt(id),
    },
    include: {
      sender: true,
    },
  });
  return res.status(200).json({ newMessage });
};

// Route to get all posts
export const getPostsByUser = async (req, res, next) => {
  const { id } = req.user;
  const posts = await prisma.post.findMany({
    where: {
      authorId: parseInt(id),
    },
    include: {
      author: true,
    },
  });
  if (!posts) {
    return res.status(400).json({ message: "No posts found" });
  }
  return res.status(200).json({ posts });
};

// Route to get a post
export const getPost = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  const post = await prisma.post.findUnique({
    where: {
      id,
    },
    include: {
      author: true,
      community: true,
    },
  });

  if (!post) {
    return res.status(400).json({ message: "Post does not exist" });
  }
  return res.status(200).json({ post });
};

// Route to create a post
export const createPost = async function (req, res, next) {
  const { id } = req.user;
  // const { content, title } = req.fields;
  const { communityId } = req.query;
  const { content, title } = req.body;

  if (!content && !req.files) {
    return res.status(400).json({ message: "No file was uploaded" });
  }

  const images = Object.entries(req.files).map((file) => ({
    path: `/uploads/${file[1].filename}`,
    image: file[1].filename,
  }));

  console.log(images);

  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ message: err.message });
    }
    if (!req.file && !req.files) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    try {
      const post = await prisma.post.create({
        data: {
          title,
          content,
          authorId: parseInt(id),
          communityId: parseInt(communityId),
          published: true,
          images: {
            createMany: {
              data: images,
            },
          },
        },
        include: {
          author: true,
          community: true,
          images: true,
        },
      });

      if (!post) {
        return res.status(400).json({ message: "Post could not be created" });
      }
      return res.status(200).json({ post });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });
};

export const uploadImages = async (req, res, next) => {
  upload.array("images", images.length)(req, res, (err) => {
    if (req.files.length === 0) {
      return res.status(400).json({ message: "No files were uploaded" });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    return res
      .status(200)
      .json({ message: "Files uploaded successfully", files: req.files });
  });
};

// Route to update a post
export const updatePost = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const { title, content } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        author: true,
      },
    });

    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    if (post.author.id !== userId) {
      res
        .status(400)
        .json({ message: "You are not authorized to update this post" });
    }

    const posts = await prisma.post.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
        content,
      },
      include: {
        author: true,
      },
    });

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const IsLiked = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    const isLiked = await prisma.postLikes.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (isLiked) {
      return res.status(200).json({ isLiked: true });
    } else {
      return res.status(200).json({ isLiked: false });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const IsDisliked = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    const isDisliked = await prisma.postDislike.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (isDisliked) {
      return res.status(200).json({ isDisliked: true });
    } else {
      return res.status(200).json({ isDisliked: false });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const DisLikePost = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    const postDislike = await prisma.postDislike.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (postDislike) {
      return res
        .status(400)
        .json({ message: "You have already disliked this post" });
    }

    const like = await prisma.postLikes.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (like) {
      await prisma.postLikes.delete({
        where: {
          id: parseInt(like.id),
        },
      });
    }

    const newDisLike = await prisma.postDislike.create({
      data: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
      include: {
        user: true,
      },
    });
    return res.status(200).json({ newDisLike });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
export const LikePost = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  console.log(id, userId);

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    const like = await prisma.postLikes.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (like) {
      return res
        .status(400)
        .json({ message: "You have already liked this post" });
    }

    const disklike = await prisma.postDislike.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (disklike) {
      await prisma.postDislike.delete({
        where: {
          id: parseInt(disklike.id),
        },
      });
    }

    const newLike = await prisma.postLikes.create({
      data: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
      include: {
        user: true,
      },
    });
    return res.status(200).json({ newLike });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const LikeRemove = async (req, res, next) => {
  const { id } = req.body;
  const { id: userId } = req.user;
  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    const like = await prisma.postLikes.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (!like) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    const newLike = await prisma.postLikes.delete({
      where: {
        id: parseInt(like.id),
      },
    });
    return res.status(200).json({ newLike });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const DisLikeRemove = async (req, res, next) => {
  const { id } = req.body;
  const { id: userId } = req.user;
  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post does not exist" });
    }
    const dislike = await prisma.postDislike.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    if (!dislike) {
      return res
        .status(400)
        .json({ message: "You have not disliked this post" });
    }

    const newDislike = await prisma.postDislike.delete({
      where: {
        id: parseInt(dislike.id),
      },
    });
    return res.status(200).json({ newDislike });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to delete a post
export const deletePost = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const { authorId } = req.body;
  if (authorId !== userId) {
    return res
      .status(400)
      .json({ message: "You are not authorized to delete this post" });
  }
  try {
    const posts = await prisma.post.delete({
      where: {
        id: parseInt(id),
      },
      include: {
        author: true,
      },
    });
    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(400).json({ message: "Post does not exist" });
  }
};

// Route to get all comments
export const getCommentsByPost = async (req, res, next) => {
  const { postId } = req.params;
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: parseInt(postId),
        parentId: null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
            createdAt: true,
          },
        },
      },

      skip: parseInt(offset),
      take: parseInt(perPage),
    });

    if (!comments) {
      return res.status(400).json({ message: "No comments found" });
    }
    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Route to community posts by user
export const getCommunityPostsByUser = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const posts = await prisma.post.findMany({
    where: {
      communityId: parseInt(id),
      authorId: parseInt(userId),
    },
    include: {
      author: true,
      community: true,
    },
  });

  if (!posts) {
    return res.status(400).json({ message: "No posts found" });
  }

  return res.status(200).json({ posts });
};

// Route to get all members of a community
