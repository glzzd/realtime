const messageService = require("../services/message.service");


const getMessages = async (req, res) => {
    const result = await messageService.getMessages({
        conversationId: req.params.conversationId,
        userId: req.user._id,
        page: Number(req.query.page) || 1,
        limit: Math.min(Number(req.query.limit) || 30, 100)
    })

    res.status(200).json({
        success: true,
        data: result.messages,
        pagination: result.pagination
    })
}

module.exports = {
    getMessages
}