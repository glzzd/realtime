const express = require("express")
const asyncHandler = require("../utils/asyncHandler")
const userController = require("../controllers/user.controller")
const authenticate = require("../middlewares/auth.middleware")
const router = express.Router()


router.get("/search", authenticate, asyncHandler(userController.searchUsers))


module.exports = router