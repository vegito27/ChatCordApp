const path = require('path')

const http = require('http')

const express = require('express')

const formatMessage = require('./utils/messages')

const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require('./utils/users')

const socketio = require('socket.io')

const app = express()

const server = http.createServer(app)

const io = socketio(server)

io.on('connection', socket => {

    console.log('New WS Connection ...')

    const botName = 'ChatCord Bot'

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        socket.emit('message', formatMessage(botName, 'Welcome To Chat Cord!'))

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`))

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)

        })
    })

    socket.on('chatMessage', msg => {

        const user = getCurrentUser(socket.id)


        io.to(user.room).emit('message', formatMessage(user.username, msg))

        console.log(msg)

    })
    socket.on('disconnect', () => {

        const user = userLeaves(socket.id)

        if (user) {

            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)

            })
        }
    })
})

app.use(express.static(path.join(__dirname, 'public')))


const PORT = 3000 || process.env.PORT


server.listen(PORT, () => console.log(`Server running on port ${PORT}`))