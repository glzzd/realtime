const { default: mongoose } = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    text: {
        type: String,
        trim: true,
        maxlength: 5000,
        required: true
    },
    deliveredTo: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    readBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    deletedAt: {
        type: Date,
        default: null
    }
}, {timestamps: true})

messageSchema.index({
    conversation: 1,
    createdAt: -1
})

const Message = mongoose.model(
    "Message", messageSchema
)

module.exports = Message