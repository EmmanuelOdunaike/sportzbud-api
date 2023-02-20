import { createError } from "../utils/error.js";
import prisma from "../prisma/prisma.js";

export const getMyPost = async (req, res, next) => {
  const { id } = req.user;
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;

  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: parseInt(id),
      },
      select: {
        createdAt: true,
        title: true,
        content: true,
        comments: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getPostsByCommunity = async (req, res, next) => {
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;

  const { id } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: {
        communityId: parseInt(id),
      },
      select: {
        id: true,
        createdAt: true,
        title: true,
        content: true,
        comments: true,
        images: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        likes: true,
        dislikes: true,
      },
      orderBy: {
        createdAt: "desc",
      },

      skip: parseInt(offset),
      take: parseInt(perPage),
    });

    if (!posts) {
      return res.status(404).json({ message: "No posts found" });
    }

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deletePost = async (req, res, next) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.delete({
      where: {
        id: id,
      },
    });
    return res.status(200).json({ post });
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong" });
  }
};

export const updatePost = async (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const { id: userId } = req.user;

  try {
    const checkExist = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      },
      select: {
        authorId: true,
      },
    });

    if (!checkExist) {
      return res.status(404).json({ message: "Post Doesn't Exist" });
    }

    if (checkExist.authorId !== userId) {
      return res.status(403).json({ message: "You are not authorized!" });
    }

    if (!title || !content) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const post = await prisma.post.update({
      where: {
        id: id,
      },
      data: {
        title,
        content,
      },
    });

    return res.status(200).json({ post });
  } catch (err) {
    return res.status(400).json({ message: "Something went wrong" });
  }
};

export const createComment = async (req, res, next) => {
  const { postId } = req.params;
  const { content } = req.body;
  const { id: userId } = req.user;

  if (!content) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: parseInt(userId),
        postId: parseInt(postId),
      },
    });

    return res.status(200).json({ comment });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error });
  }
};

export const replyComment = async (req, res, next) => {
  const { postId, commentId } = req.query;
  const { content } = req.body;
  const { id: userId } = req.user;

  if (!content) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        parentId: parseInt(commentId),
        postId: parseInt(postId),
      },
    });
    return res.status(200).json({ comment });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const updateComment = async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;
  const { id: userId } = req.user;

  try {
    const checkExist = await prisma.comment.findFirst({
      where: {
        id: parseInt(id),
      },
      select: {
        authorId: true,
        postId: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!checkExist) {
      return res.status(404).json({ message: "Comment Doesn't Exist" });
    }

    if (
      checkExist.authorId !== userId ||
      checkExist.postId.authorId !== userId
    ) {
      return res.status(403).json({ message: "You are not authorized!" });
    }

    if (!content) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const comment = await prisma.comment.update({
      where: {
        id: id,
      },
      data: {
        content,
      },
    });

    return res.status(200).json({ comment });
  } catch (err) {
    return res.status(400).json({ message: "Something went wrong" });
  }
};

export const deleteComment = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    const checkExist = await prisma.comment.findFirst({
      where: {
        id: parseInt(id),
      },
      select: {
        authorId: true,
        postId: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!checkExist) {
      return res.status(404).json({ message: "Comment Doesn't Exist" });
    }

    if (
      checkExist.authorId !== userId ||
      checkExist.postId.authorId !== userId
    ) {
      return res.status(403).json({ message: "You are not authorized!" });
    }

    const comment = await prisma.comment.delete({
      where: {
        id: id,
      },
    });
    return res.status(200).json({ comment });
  } catch (error) {
    return res.status(400).json({ error });
  }
};
