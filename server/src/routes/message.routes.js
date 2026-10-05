const express = require("express")
const asyncHandler = require("../utils/asyncHandler")
const authenticate = require("../middlewares/auth.middleware")
const messageController = require("../controllers/message.controller")
const router = express.Router()

router.use(authenticate)

router.get("/:conversationId", asyncHandler(messageController.getMessages))


module.exports = router