const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Creating a schema, sort of like working with an ORM
const PlayerScoreSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name field is required.']
    },
    score: {
        type: Number,
        required: [true, 'Score field is required.']
    }
})

// Creating a table within database with the defined schema
const PlayerScore = mongoose.model('player_score', PlayerScoreSchema)

// Exporting table for querying and mutating
module.exports = PlayerScore