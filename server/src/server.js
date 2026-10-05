require("dotenv").config();

const connectDatabase = require("./config/database");
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const initializeSocket = require("./socket/socket");

const PORT = process.env.PORT || 5000



const startServer = async () => {
    await connectDatabase()

    const server = http.createServer(app)
    const io = new Server(server,{
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    })
    initializeSocket(io)

server.listen(PORT, ()=>{
    console.log(`Server islekdir: ${PORT}` );
    
})

}


startServer()


