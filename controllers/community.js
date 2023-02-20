import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prisma.js";

// @route POST api/community/create to create a community
export const createCommunity = async (req, res, next) => {
  let { name, description, sportId, members } = req.body;
  const { id } = req.user;
  console.log(members);

  members = JSON.parse(members);
  members.push(id);
  console.log(members);
  console.log(typeof members);
  console.log(Object.entries(members));

  if (!name || !description || !sportId) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  if (members.length < 3) {
    return res.status(400).json({ message: "Please add atleast 3 members" });
  }
  const x = Object.entries(members).map((item) => item[1]);

  try {
    let community;
    if (req.file) {
      community = await prisma.community.create({
        data: {
          name: name,
          description: description,
          sportId: parseInt(sportId),
          ownerId: parseInt(id),
          image: req.file.path.split("public/")[1],
        },
        select: {
          id: true,
          name: true,
          description: true,
          sportId: true,
          ownerId: true,
          image: true,
        },
      });
    } else {
      community = await prisma.community.create({
        data: {
          name: name,
          description: description,
          sportId: parseInt(sportId),
          ownerId: parseInt(id),
        },
        select: {
          id: true,
          name: true,
          description: true,
          sportId: true,
          ownerId: true,
          image: true,
        },
      });
    }

    const m = await prisma.communityMembers.createMany({
      data: x.map((id) => ({
        communityId: community.id,
        userId: parseInt(id),
      })),
    });

    return res.status(200).json({ community, members: m });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Route to get all members of a community
export const getMembersByCommunity = async (req, res, next) => {
  const { page, limit } = req.query;
  const { id } = req.params;
  console.log(page, limit);
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  try {
    const members = await prisma.communityMembers.findMany({
      where: {
        communityId: parseInt(id),
      },
      select: {
        user: {
          select: {
            id: true,
            profilePicture: true,
            firstName: true,
            lastName: true,
            fullName: true,
            sports: {
              select: {
                sport: true,
              },
            },
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });

    return res.status(200).json({ members });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};
// @route GET api/community/communities to get all communities by user
export const getCommunitiesByUser = async (req, res, next) => {
  const { userId } = req.query;
  const { page, limit, search } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;

  try {
    if (search) {
      const communities = await prisma.communityMembers.findMany({
        where: {
          userId: parseInt(userId),
          community: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        select: {
          community: true,
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });
      return res.status(200).json({ communities });
    }

    const communities = await prisma.communityMembers.findMany({
      where: {
        userId: parseInt(userId),
      },
      select: {
        community: true,
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });
    return res.status(200).json({ communities });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

// @route GET api/community/communitiesList to get all communities
export const getCommunities = async (req, res, next) => {
  const { page, limit, suggestCommunitySearch } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  const { id } = req.user;

  try {
    if (suggestCommunitySearch) {
      const communitiesList = await prisma.community.findMany({
        where: {
          name: {
            contains: suggestCommunitySearch,
            mode: "insensitive",
          },
          ownerId: {
            not: parseInt(id),
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          ownerId: true,
          sportId: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });

      const communities = communitiesList.map((community) => {
        const isMember = community.members.some(
          (member) => member.userId === parseInt(id)
        );
        return {
          ...community,
          isMember: isMember,
        };
      });
      console.log(communities);
      return res.status(200).json({ communities });
    }

    const communitiesList = await prisma.community.findMany({
      where: {
        ownerId: {
          not: parseInt(id),
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        ownerId: true,
        sportId: true,
        members: {
          select: {
            userId: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });

    const communities = communitiesList.map((community) => {
      const isMember = community.members.some(
        (member) => member.userId === parseInt(id)
      );
      return {
        ...community,
        isMember: isMember,
      };
    });
    console.log(communities);
    return res.status(200).json({ communities });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// @route GET api/community/communities/:id to get a community by id
export const getCommunityById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const community = await prisma.community.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        description: true,
        name: true,
        image: true,
        ownerId: true,
        sportId: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        sport: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // console.log(community)

    return res.status(200).json({ community });
  } catch (error) {
    return res.status(400).json({ message: "Community not found" });
  }
};

// @route GET api/community/myCommunities to get all communities by user
export const getMyCommunity = async (req, res, next) => {
  const { id } = req.user;
  const { page, limit } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  try {
    const communities = await prisma.community.findMany({
      where: {
        ownerId: parseInt(id),
      },
      skip: parseInt(offset),
      take: parseInt(perPage),
    });
    return res.status(200).json({ communities });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// @route  POST api/community/isAlreadyMemeber/:id to check if user is already member of community
export const AlreadyMemeber = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  try {
    const isMember = await prisma.communityMembers.findFirst({
      where: {
        AND: [
          {
            userId: parseInt(userId),
          },
          {
            communityId: parseInt(id),
          },
        ],
      },
    });
    if (isMember) {
      return res.status(200).json({ isMember: true });
    } else {
      return res.status(200).json({ isMember: false });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// @route GET api/community/ownerInfo to get owner info
export const getCommunityOwnerInfo = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  try {
    const community = await prisma.community.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        ownerId: true,
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(community.ownerId),
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });
    console.log(user);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// @route DELETE api/community/deleteCommunity/:id to delete community
export const deleteCommunity = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const hasAccess = await prisma.community.findMany({
      where: {
        id: parseInt(id),
        ownerId: parseInt(userId),
      },
    });
    if (!hasAccess) {
      return res
        .status(400)
        .json({ message: "You don't have access to delete this community" });
    }
    const community = await prisma.community.delete({
      where: {
        id: parseInt(id),
      },
    });
    return res.status(200).json({ community });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

// @route POST api/community/joinCommunity/:id to join community
export const joinCommunity = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const community = await prisma.community.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!community) {
      return res.status(400).json({ message: "Community not found" });
    }

    if (community.ownerId === parseInt(userId)) {
      return res
        .status(400)
        .json({ message: "You are owner of this community" });
    }

    const alReadyExist = await prisma.communityMembers.findFirst({
      where: {
        userId: parseInt(userId),
        communityId: parseInt(id),
      },
    });
    if (alReadyExist) {
      return res.status(409).json({ message: "Already member" });
    }
    const userCommunity = await prisma.communityMembers.create({
      data: {
        communityId: parseInt(id),
        userId: parseInt(userId),
      },
    });
    return res.status(200).json({ userCommunity });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

// @route POST api/community/leaveCommunity/:id to leave community

export const leaveCommunity = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const isAlreadyMember = await prisma.communityMembers.findFirst({
      where: {
        communityId: parseInt(id),
        userId: parseInt(userId),
      },
    });

    if (!isAlreadyMember) {
      return res
        .status(400)
        .json({ message: "You are not member of this community" });
    }

    const isOwner = await prisma.community.findFirst({
      where: {
        id: parseInt(id),
        ownerId: parseInt(userId),
      },
    });

    if (isOwner) {
      return res
        .status(400)
        .json({ message: "You are owner of this community" });
    }

    const leaveCommunity = await prisma.communityMembers.delete({
      where: {
        id: isAlreadyMember.id,
      },
    });
    return res.status(200).json({ leaveCommunity });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

// @route DELETE api/community/deleteMember to delete member from community

export const deleteMember = async (req, res, next) => {
  const { id, memberId } = req.query;
  const { id: userId } = req.user;

  try {
    const isCommunityExist = await prisma.community.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!isCommunityExist) {
      return res.status(400).json({ message: "Community not found" });
    }

    const isAlreadyMember = await prisma.communityMembers.findFirst({
      where: {
        communityId: parseInt(id),
        userId: parseInt(memberId),
      },
    });

    if (!isAlreadyMember) {
      return res
        .status(400)
        .json({ message: "This user is not member of this community" });
    }

    const isOwner = await prisma.community.findFirst({
      where: {
        id: parseInt(id),
        ownerId: parseInt(userId),
      },
    });

    if (userId === memberId) {
      return res.status(400).json({ message: "You can't remove yourself" });
    }

    if (!isOwner) {
      return res
        .status(400)
        .json({ message: "You're not authorized to remove owner" });
    }

    const deleteMember = await prisma.communityMembers.delete({
      where: {
        id: parseInt(isAlreadyMember.id),
      },
    });
    return res.status(200).json({ deleteMember });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const updateCommunity = async (req, res, next) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const { name, description, sportId } = req.body;

  let data = {
    name,
    description,
  };

  console.log(req.params);

  try {
    const hasAccess = await prisma.community.findMany({
      where: {
        id: parseInt(id),
        ownerId: parseInt(userId),
      },
    });
    if (req.file) {
      data.image = req.file.path.split("public/")[1];
    } else {
      data.image = hasAccess[0].image;
    }
    if (sportId) {
      data.sportId = parseInt(sportId);
    } else {
      data.sportId = hasAccess[0].sportId;
    }
    if (!hasAccess) {
      return res
        .status(400)
        .json({ message: "You don't have access to update this community" });
    }
    const community = await prisma.community.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...data,
      },
    });
    return res.status(200).json({ community });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};
