const userService = require("../services/user.service");




const searchUsers = async(req, res)=>{
  const users = await userService.searchUsers({
    search: req.query.search,
    currentUserId: req.user._id
  })

  res.status(200).json({
    success: true,
    data: users
  })
}

module.exports = {
  searchUsers
}