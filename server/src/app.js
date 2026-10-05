 const express = require("express")
 const cors = require("cors")
 const authRoutes = require("./routes/auth.routes")
 const messageRoutes = require("./routes/message.routes")
 const userRoutes = require("./routes/user.routes")
 const conversationRoutes = require("./routes/conversation.routes")
const errorMiddleware = require("./middlewares/error.middleware")

const app = express()


app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
)

app.use(express.json())

app.get("/api/health", (req,res)=>{
    res.status(200).json({
        success:true,
        message:"CHAT API-si Işləkdir"
    })
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/messages", messageRoutes)

app.use(errorMiddleware)

module.exports = app