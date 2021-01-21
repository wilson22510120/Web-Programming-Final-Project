const Deck = require('./deck')
const Player = require('./player')

// const mongoose = require('mongoose')
var MongoClient = require('mongodb').MongoClient;
const PlayerScore = require('./models/player_score')
const Record = require('./models/record')

//if (!process.env.MONGO_URL) {
//    console.error('Missing MONGO_URL!!!')
//    process.exit(1)
//}

// MongoClient.connect(process.env.MONGO_URL, function(err, db) {
//     if (err) throw err;
//     console.log('mongodb is running!');
//     var dbo = db.db("final");
//     dbo.createCollection("record")
//     dbo.createCollection("player_score")
//     db.close();
// });

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./sqlite.db');

db.run('DELETE FROM player_score where score >= 0')
db.run('DELETE FROM record where game_index > 0')

// db.run('INSERT INTO record(game_index, winner_index) VALUES(1, 1)')
// db.run('INSERT INTO record(game_index, winner_index) VALUES(2, 3)')
// db.run('INSERT INTO record(game_index, winner_index) VALUES(3, 1)')
function getScore() {
    let sql = `SELECT DISTINCT Name name FROM player_score
           ORDER BY name`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row.name);
        });
        console.log(rows)
    });

}
chooseFirstPlayer = (players) => {
    // fetch
    let firstPlayer = -1
        // console.log("in func")
        // const client = await MongoClient.connect(process.env.MONGO_URL, { useNewUrlParser: true }).catch(err => { console.log(err); });
        // if (!client) {
        //     return;
        // }
        // console.log("middle");
        // const db = client.db("final");

    let sql = `SELECT * FROM record ORDER BY game_index`;

    console.log("before get")
    db.all(sql, [], (err, rows) => {
        console.log("in get")
        if (err) {
            console.log(err)
        } else {
            console.log("rows: ", rows)
            if (rows.length) {
                firstPlayer = rows[0].winner_index
                console.log("firstPlayer", firstPlayer)
            }
        }
    })

    if (firstPlayer === -1) {
        firstPlayer = players[Math.floor(Math.random() * players.length)].seatNum
    }
    return firstPlayer
}

class Table {
    constructor(tableID) {
        this.turn = -1
        this.players = []
        this.tableID = tableID
        this.deck = new Deck(false)
        this.seat = ["", "", "", ""]
        this.gameCnt = 0
    }
    reset() {
        this.turn = -1
        this.players = []
        this.deck.reset()
        this.seat = ["", "", "", ""]
        this.gameCnt = 0
    }
    restart() {
        //this.turn = -1
        this.deck.reset()
        for (let i = 0; i < this.players.length; i++)
            this.players[i].reset()
    }
    leave(i) {
        if (i === -1) return
        if (this.turn === -1) {
            this.players = this.players.filter((p) => { return p.seatNum !== i })
            this.seat[i] = ""
        } else {
            this.reset()
            this.broadcast(["reset"])
        }

    }
    get Num() {
        return this.players.filter((p) => { return p.alive }).length
    }
    sitDown(client, name, seatNum) {
        if (this.seat[seatNum] === "") {
            this.seat[seatNum] = name
            this.addPlayer(client, name, seatNum)
            this.broadcast(['seat', this.seat])
            client.send(JSON.stringify(['sitSuccess', seatNum]))
        } else if (this.seat.length === 4) {
            client.send(JSON.stringify(['error', 'Sorry, the table is full, please wait']))
        } else {
            client.send(JSON.stringify(['error', 'Sorry, please try again']))
        }
    }

    play(payload) {
        this.playerByNum(this.turn).invisible = false
        if (payload[0] === 1) {
            if (this.playerHand(Number(payload[1])) === Number(payload[2])) {
                this.lose(Number(payload[1]))
            }
        } else if (payload[0] === 2) {

            this.sendByNum(this.turn, ['status', { type: 'info', msg: ('Player' + payload[1] + '\'s hand is ' + String(this.playerHand(Number(payload[1])))) }])
        } else if (payload[0] === 3) {
            if (this.playerHand(payload[1]) > payload[2]) {
                this.lose(this.turn)
            } else if (this.playerHand(payload[1]) < payload[2]) {
                this.lose(payload[1])
            } else {
                this.sendByNum(this.turn, ['status', { type: 'info', msg: "Nothing happen..." }])
            }
        } else if (payload[0] === 4) {
            this.playerByNum(this.turn).invisible = true
            this.broadcast(['invisible', this.turn])
        } else if (payload[0] === 5) {
            if (this.playerHand(payload[1]) === 8) {
                this.lose(payload[1])
            } else {
                this.playerByNum(payload[1]).discard()
                this.drawByNum(payload[1])
            }
        } else if (payload[0] === 6) {
            this.playerByNum(this.turn).setHand(this.playerHand(payload[1]))
            this.playerByNum(payload[1]).setHand(payload[2])
        } else if (payload[0] === 7) {

        } else if (payload[0] === 8) {
            this.lose(this.turn)
            return
        }
        this.playerByNum(this.turn).play(payload[0])
        this.broadcast(['boardUpdate', [this.turn, payload[0]]])
        this.broadcast(['lastPlay', payload[0]])
    }
    lose(n) {
        this.playerByNum(n).alive = false
        this.broadcast(['lose', n])
    }
    win(n) {
        db.run('INSERT INTO record(game_index, winner_index) VALUES(' + String(this.gameCnt) + ', ' + String(n) + ')')

        db.run("UPDATE player_score SET score=score+1 WHERE name='" + this.playerByNum(n).name + "'")
        this.broadcast(['win', n])
        this.restart()
        this.turn = n
        console.log(getScore())
    }
    broadcast(msg) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].client.send(JSON.stringify(msg))
        }
    }
    playerHand(n) {
        return this.playerByNum(n).hand[0]
    }
    playerByNum(n) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].seatNum === n) return this.players[i]
        }
    }
    get draw() {

        return this.deck.draw
    }
    get clients() {
        let out = []
        for (let i = 0; i < this.players.length; i++) {
            out.push(this.players[i].client)
        }
        return out
    }
    sendByNum(n, msg) {
        //if(!this.playerByNum(n)) console.log("AAAAAAAAA")
        //console.log("this.playerByNum(n)", this.playerByNum(n), n)
        this.playerByNum(n).client.send(JSON.stringify(msg))
    }
    drawByNum(n) {
        const card = this.draw
        this.sendByNum(n, ['draw', card])
        this.playerByNum(n).draw(card)
    }

    init() {
        this.gameCnt += 1
            //db.run('INSERT INTO record(game_index, winner_index) VALUES(3, 1)')
        for (let i = 0; i < this.players.length; i++) {
            db.run("INSERT INTO player_score(name, score) VALUES('" + this.players[i].name + "',0)")
        }
        console.log("playerNum", this.players.length)
            // const start = Math.floor(Math.random() * this.players.length)
        this.turn = chooseFirstPlayer(this.players)
            //console.log("turn=" ,this.turn)
        for (let i = 0; i < this.players.length; i++) {
            this.drawByNum(this.players[i].seatNum)
                //this.sendByNum(this.players[i].seatNum,['start', start])
        }
        //this.turn = this.players[start].seatNum
        this.drawByNum(this.turn)
        this.broadcast(['turn', this.turn])
        this.broadcast(['deckNum', this.deck.num])
            //this.broadcast(['start', this.deck.num])
            //this.showHand()
    }

    showHand() {
        for (let i = 0; i < this.players.length; i++) {
            console.log(this.players[i].name, this.players[i].hand)
        }
    }
    nextRound() {
        //console.log(this.players.filter(i=>i.alive))
        //console.log(this.players[0].alive,this.players[1].alive)
        if (this.players.filter((i) => i.alive).length === 1) {
            console.log('aaa')
            this.win(this.players.filter((i) => i.alive)[0].seatNum)
        } else if (this.deck.cur === 15) {
            this.battle()
        } else {
            this.turn = (this.turn + 1) % 4
            while (this.playerByNum(this.turn) === undefined || !this.playerByNum(this.turn).alive) {
                this.turn = (this.turn + 1) % 4
            }

            this.drawByNum(this.turn)
            this.broadcast(['turn', this.turn])
        }
        console.log(this.deck.num)
        this.broadcast(['deckNum', this.deck.num])

    }
    showAlive() {
        for (let i = 0; i < this.players.length; i++) {
            console.log(this.players[i].name, this.players[i].alive)
        }
    }
    addPlayer(client, name, seatNum) {
        this.players.push(new Player(client, name, seatNum))
    }

}
module.exports = Table