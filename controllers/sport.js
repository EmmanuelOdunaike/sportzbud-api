import { createError } from "../utils/error.js";
import prisma from "../prisma/prisma.js";
// route to get all sports
export const getSports = async (req, res, next) => {
  const { page, limit, searchQuery } = req.query;
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  try {
    if (searchQuery) {
      const sports = await prisma.sport.findMany({
        skip: parseInt(offset),
        take: parseInt(perPage),
        where: {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      });
      return res.status(200).json({ sports });
    }

    const sports = await prisma.sport.findMany({
      skip: parseInt(offset),
      take: parseInt(perPage),
    });

    return res.status(200).json({ sports });
  } catch (error) {
    console.log("error:", error);
    return res.status(400).json({ error: error.message });
  }
};

// route to find sports interest by user id
export const findSportsInterestByUserID = async (req, res, next) => {
  const { id } = req.params;
  try {
    const interest = await prisma.sportUsers.findMany({
      where: {
        userId: parseInt(id),
      },
      include: {
        sport: true,
      },
    });
    return res.status(200).json({ interest });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// route to create a sport
export const createSport = async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Please enter name fields" });
  }
  try {
    const sport = await prisma.sport.create({
      data: {
        name,
      },
    });
    return res.status(200).json({ sport });
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong" });
  }
};
// route to get a sport by id
export const getSportById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const sport = await prisma.sport.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json({ sport });
  } catch (error) {
    return res.status(400).json("Sports Doesn't Found");
  }
};
// route to update a sport
export const updateSport = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Please enter name fields" });
  }

  try {
    const sport = await prisma.sport.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
      },
    });
    return res.status(200).json({ sport });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// route to delete a sport
export const deleteSport = async (req, res, next) => {
  const { id } = req.params;
  try {
    const sport = await prisma.sport.delete({
      where: {
        id: parseInt(id),
      },
    });
    return res.status(200).json({ sport });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// route to get all sports users
export const sportsUser = async (req, res, next) => {
  const { id } = req.params;

  let { page, limit, gender, location, ageGt, ageLt, sportUserSearch } = req.query;
  if (ageGt === '' || ageLt === '' || ageGt < 0 || ageLt < 0) {
    ageGt = parseInt(0);
    ageLt = parseInt(200);
  }
  const currentPage = page || 1;
  const perPage = limit || 10;
  const offset = (currentPage - 1) * perPage;
  try {
    if (sportUserSearch) {
      const sports = await prisma.sportUsers.findMany({
        where: {
          sportId: parseInt(id),
          user: {
            OR: [
              {
                firstName: {
                  contains: sportUserSearch,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: sportUserSearch,
                  mode: "insensitive",
                },
              },
              {
                fullName: {
                  contains: sportUserSearch,
                  mode: "insensitive",
                }
              }
            ],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              age: true,

            }
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      }
      )
      return res.status(200).json({ sports });
    }



    if (gender !== '' && location === '') {
      const sports = await prisma.sportUsers.findMany({
        where: {
          sportId: parseInt(id),
          user: {
            gender: {
              equals: gender
            },
            age: {
              gte: parseInt(ageGt),
              lte: parseInt(ageLt),
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              age: true,

            }
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });
      return res.status(200).json({ sports });
    }
    else if (gender === '' && location !== '') {
      const sports = await prisma.sportUsers.findMany({
        where: {
          sportId: parseInt(id),
          user: {
            location: {
              contains: location,
              mode: "insensitive",
            },
            age: {
              gte: parseInt(ageGt),
              lte: parseInt(ageLt),
            }
          }

        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              age: true,

            }
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });
      return res.status(200).json({ sports });
    }

    else if (gender !== '' && location !== '') {
      const sports = await prisma.sportUsers.findMany({
        where: {
          sportId: parseInt(id),
          user: {
            gender: {
              equals: gender
            },
            location: {
              contains: location,
              mode: "insensitive",
            },
            age: {
              gte: parseInt(ageGt),
              lte: parseInt(ageLt),
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              age: true,

            }
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });
      return res.status(200).json({ sports });
    }
    else if (gender === '' && location === '') {
      const sports = await prisma.sportUsers.findMany({
        where: {
          sportId: parseInt(id),
          user: {
            age: {
              gte: parseInt(ageGt),
              lte: parseInt(ageLt),
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              age: true,

            }
          },
        },
        skip: parseInt(offset),
        take: parseInt(perPage),
      });
      console.log(offset, perPage)
      return res.status(200).json({ sports });
    }


  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// route to follow sport
export const sportsFollow = async (req, res, next) => {
  const { sportId } = req.body;
  const { id: userId } = req.user;

  try {
    const isExits = await prisma.sportUsers.findFirst({
      where: {
        sportId: parseInt(sportId),
        userId: parseInt(userId),
      },
    });
    if (isExits) {
      return res.status(400).json({ message: "Already Followed" });
    }
    const sport = await prisma.sportUsers.create({
      data: {
        sportId: parseInt(sportId),
        userId: parseInt(userId),
      },
    });
    return res.status(200).json({ sport });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// route to check if user is following a sport
export const isFollowing = async (req, res, next) => {
  const { sportId } = req.query;
  const { id: userId } = req.user;
  try {
    const isExits = await prisma.sportUsers.findFirst({
      where: {
        sportId: parseInt(sportId),
        userId: parseInt(userId),
      },
    });
    if (isExits) {
      return res.status(200).json({ isFollowing: true });
    } else {
      return res.status(200).json({ isFollowing: false });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// route to unfollow sport

export const UnFollowSport = async (req, res, next) => {
  const { sportId } = req.params;
  const { id: userId } = req.user;
  try {
    const isExits = await prisma.sportUsers.findFirst({
      where: {
        sportId: parseInt(sportId),
        userId: parseInt(userId),
      },
    });
    if (!isExits) {
      return res.status(400).json({ message: "Already UnFollowed" });
    }
    const sport = await prisma.sportUsers.delete({
      where: {
        id: parseInt(isExits.id),
      },
    });
    return res.status(200).json({ sport });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
