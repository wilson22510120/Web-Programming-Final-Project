require('dotenv-defaults').config()
const { useState } = require('react')
const http = require('http')
const express = require('express')
const mongoose = require('mongoose')
const WebSocket = require('ws')
const Table = require('./table')
const path = require('path');
// const Message = require('./models/message')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
app.use(express.static(path.join(__dirname, '../build')));

app.get('/', (req, res, next) => res.sendFile(__dirname + './index.html'));
// if (!process.env.MONGO_URL) {
//   console.error('Missing MONGO_URL!!!')
//   process.exit(1)
// }

// mongoose.connect(process.env.MONGO_URL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })

// const db = mongoose.connection




// db.on('error', (error) => {
//   console.error(error)
// })
//let cur = -1
const table = new Table(0)
console.log(table.deck)
    //let seat = ["","","",""]
    //console.log(seat)
let CLIENTS = []
const broadcast = (msg) => {
    for (let i = 0; i < CLIENTS.length; i++) {
        CLIENTS[i].send(JSON.stringify(msg))
    }
}

wss.on('connection', ws => {

    const sendData = (data) => {
        ws.send(JSON.stringify(data))

    }

    const sendStatus = (s) => {
        sendData(['status', s])
    }

    //console.log(CLIENTS[0] == CLIENTS[1])
    ws.onmessage = (message) => {
        const { data } = message

        const [task, payload] = JSON.parse(data)
        switch (task) {
            case 'init':
                {

                    CLIENTS.push(ws)
                    console.log(CLIENTS.length)
                    sendData(['seat', table.seat])

                    break
                }

            case 'sitDown':
                {
                    //console.log(payload)
                    if (table.turn !== -1) {
                        ws.send(JSON.stringify(['error', 'The game has started, please wait for next game']))
                    } else {
                        table.sitDown(ws, payload[1], payload[0])
                        broadcast(['seat', table.seat])

                    }
                    break
                }
            case 'start':
                {
                    table.init()
                    break
                }
            case 'play':
                {
                    table.play(payload)
                    table.nextRound()
                    break
                }
            case 'bye':
                {
                    console.log("bye")
                    table.leave(payload)
                    broadcast(['seat', table.seat])
                    const index = CLIENTS.indexOf(ws);
                    if (index > -1) {
                        CLIENTS.splice(index, 1);
                    }
                    break
                }
            case 'leave':
                {
                    table.leave(payload)
                    broadcast(['seat', table.seat])
                    break
                }

            default:
                {
                    console.log("wrong")
                    break
                }

        }
        //table.showAlive()
        //table.showHand()
    }
})


const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`)
})