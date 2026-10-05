const express = require("express")
const authenticate = require("../middlewares/auth.middleware")
const asyncHandler = require("../utils/asyncHandler")
const conversationController = require("../controllers/conversation.controller")
const router = express.Router()

router.use(authenticate)

router.post("/", asyncHandler(conversationController.createOrGetConversation))
router.get("/", asyncHandler(conversationController.getUserConversation))


module.exports = router