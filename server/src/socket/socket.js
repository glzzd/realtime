const User = require("../models/User.model")
const socketAuthentication = require("./socket.auth")
const conversationService = require("../services/conversation.sevice")
const messageService = require("../services/message.service")

const initializeSocket = (io) => {
    io.use(socketAuthentication)

    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString()

        console.log(`İstifadəçi qoşuldu: ${userId}`)

        try {
            await User.findByIdAndUpdate(userId, {
                isOnline: true
            })

            socket.emit("user:connected", {
                userId
            })

            io.emit("user:online", {
                userId
            })

            socket.on("conversation:join", async ({ conversationId }) => {
                try {
                    const isMember =
                        await conversationService.isConversationMember({
                            conversationId,
                            userId
                        })

                    if (!isMember) {
                        return socket.emit("error", {
                            code: "NOT_CONVERSATION_MEMBER",
                            message: "Siz bu danışıqxananın üzvü deyilsiniz"
                        })
                    }

                    socket.join(`conversation:${conversationId}`)

                    socket.emit("conversation:joined", {
                        conversationId
                    })
                } catch (error) {
                    socket.emit("error", {
                        code: "JOIN_FAILED",
                        message: error.message
                    })
                }
            })

            socket.on("message:send", async ({ conversationId, text }) => {
                try {
                    const message = await messageService.sendMessage({
                        conversationId,
                        senderId: userId,
                        text
                    })

                    io.to(`conversation:${conversationId}`).emit(
                        "message:new",
                        message
                    )
                } catch (error) {
                    socket.emit("message:error", {
                        code: error.code || "MESSAGE_SEND_FAILED",
                        message: error.message
                    })
                }
            })

            socket.on("typing:start", async ({ conversationId }) => {
                try {
                    const isMember =
                        await conversationService.isConversationMember({
                            conversationId,
                            userId
                        })

                    if (!isMember) return

                    socket
                        .to(`conversation:${conversationId}`)
                        .emit("typing:start", {
                            conversationId,
                            userId
                        })
                } catch (error) {
                    socket.emit("error", {
                        code: error.code || "TYPING_START_FAILED",
                        message: error.message
                    })
                }
            })

            socket.on("typing:stop", async ({ conversationId }) => {
                try {
                    const isMember =
                        await conversationService.isConversationMember({
                            conversationId,
                            userId
                        })

                    if (!isMember) return

                    socket
                        .to(`conversation:${conversationId}`)
                        .emit("typing:stop", {
                            conversationId,
                            userId
                        })
                } catch (error) {
                    socket.emit("error", {
                        code: error.code || "TYPING_STOP_FAILED",
                        message: error.message
                    })
                }
            })

            socket.on("message:read", async ({ conversationId }) => {
                try {
                    const isMember =
                        await conversationService.isConversationMember({
                            conversationId,
                            userId
                        })

                    if (!isMember) {
                        return socket.emit("error", {
                            code: "NOT_CONVERSATION_MEMBER",
                            message: "Siz bu danışıqxananın üzvü deyilsiniz"
                        })
                    }

                    await messageService.markAsRead({
                        conversationId,
                        userId
                    })

                    socket
                        .to(`conversation:${conversationId}`)
                        .emit("message:read", {
                            conversationId,
                            userId
                        })
                } catch (error) {
                    socket.emit("error", {
                        code: error.code || "MESSAGE_READ_FAILED",
                        message: error.message
                    })
                }
            })

            socket.on("disconnect", async () => {
                try {
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false
                    })

                    io.emit("user:offline", {
                        userId
                    })

                    console.log(`İstifadəçi ayrıldı: ${userId}`)
                } catch (error) {
                    console.error(
                        `User offline update error: ${error.message}`
                    )
                }
            })
        } catch (error) {
            console.error(
                `Socket connection error: ${error.message}`
            )

            socket.emit("error", {
                code: "CONNECTION_FAILED",
                message: error.message
            })
        }
    })
}

module.exports = initializeSocket
