const Conversation = require("../models/Conversation.model")
const Message = require("../models/Message.model")
const AppError = require("../utils/AppError")

const sendMessage = async ({conversationId, senderId, text}) => {
    const conversation = Conversation.findOne({_id: conversationId, participants:senderId})

    if(!conversation){
        throw new AppError("Söhbət tapılmadı", 404, "CONVERSATION_NOT_FOUND")
    }

    if(!text || !text.trim()){   
        throw new AppError("Mesaj boş göndərilə bilməz", 400, "EMPTY_MESSAGE")
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        text: text.trim(),
        deliveredTo: [senderId],
        readBy: [senderId]
    })

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id
    }
    )

    return Message.findById(message._id).populate("sender", "name email").lean()

}

const getMessages = async ({conversationId, userId, page=2, limit=30}) => {
    const conversation = await Conversation.exists({
        _id: conversationId,
        participants: userId
    })

    if(!conversation){
        throw new AppError("Söhbət tapılmadı", 404, "CONVERSATION_NOT_FOUND")
    }

    const skip = (page-1)*limit

    const [messages, total] = await Promise.all([
        Message.find({
            conversation: conversationId,
            deletedAt: null
        }).populate("sender", "name email").sort({
            createdAt: -1
        }).skip(skip).limit(limit).lean(),

        Message.countDocuments({
            conversation: conversationId,
            deletedAt: null
        })
    ]) 

    const totalPages = Math.ceil(total/limit)

    return {
        messages,
        pagination:{
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages
        }
    }

}

const markAsRead = async ({
    conversationId, userId
}) => {
    const conversation = await Conversation.exists({
        _id: conversationId,
        participants: userId
    })

    if(!conversation){
        throw new AppError("Söhbət tapılmadı", 404, "CONVERSATION_NOT_FOUND")
    }

    await Message.updateMany({
        conversation: conversationId,
        sender: { $ne: userId},
        readBy: { $ne: userId},

    }, {
        $addToSet: {
            readBy: userId
        }
    })
}

module.exports = {
    sendMessage,
    getMessages,
    markAsRead
}