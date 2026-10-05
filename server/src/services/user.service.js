const searchUsers = async (search, currentUserId) => {
  const regex = new RegExp(search, "i");

  return User.find({
    _id: {
      $ne: currentUserId,
    },
    $or: [
      {
        name: regex,
      },
      {
        email: regex,
      },
    ],
  }).select("name email isOnline lastSeenAt").limit(20).lean()
};

module.exports = {
    searchUsers
}