const Conversation = require("../models/Conversation.model")
const User = require("../models/User.model")
const AppError = require("../utils/AppError")

const createOrGetConversation = async ({
    currentUserId,
    targetUserId
}) => {
    if (!currentUserId || !targetUserId) {
        throw new AppError(
            "currentUserId və targetUserId tələb olunur",
            400,
            "INVALID_USER_IDS"
        )
    }

    if (currentUserId.toString() === targetUserId.toString()) {
        throw new AppError(
            "Özünüzlə mesajlaşa bilməzsiniz",
            400,
            "SELF_CONVERSATION"
        )
    }

    const targetUser = await User.findById(targetUserId)

    if (!targetUser) {
        throw new AppError(
            "Qarşı tərəfin istifadəçisi tapılmadı",
            404,
            "USER_NOT_FOUND"
        )
    }

    let conversation = await Conversation.findOne({
        participants: {
            $all: [
                currentUserId,
                targetUserId
            ]
        }
    })
        .populate(
            "participants",
            "name email isOnline lastSeenAt"
        )
        .populate("lastMessage")

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [
                currentUserId,
                targetUserId
            ]
        })

        conversation = await conversation.populate(
            "participants",
            "name email isOnline lastSeenAt"
        )
    }

    return conversation
}

const getUserConversations = async ({ userId }) => {
    return Conversation.find({
        participants: userId
    })
        .populate(
            "participants",
            "name email isOnline lastSeenAt"
        )
        .populate("lastMessage")
        .sort({
            updatedAt: -1
        })
        .lean()
}

const isConversationMember = async ({
    conversationId,
    userId
}) => {
    return Conversation.exists({
        _id: conversationId,
        participants: userId
    })
}

module.exports = {
    createOrGetConversation,
    getUserConversations,
    isConversationMember
}
