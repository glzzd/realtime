const conversationService = require("../services/conversation.sevice")

const createOrGetConversation = async (req, res) => {
    const conversation =
        await conversationService.createOrGetConversation({
            currentUserId: req.user._id,
            targetUserId: req.body.userId
        })

    res.status(200).json({
        success: true,
        data: conversation
    })
}

const getUserConversation = async (req, res) => {
    const conversations =
        await conversationService.getUserConversations({
            userId: req.user._id
        })

    res.status(200).json({
        success: true,
        data: conversations
    })
}

module.exports = {
    createOrGetConversation,
    getUserConversation
}
