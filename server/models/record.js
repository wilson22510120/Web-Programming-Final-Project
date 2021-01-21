const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Creating a schema, sort of like working with an ORM
const RecordSchema = new Schema({
    game_index: {
        type: Number,
        required: [true, 'Game field is required.']
    },
    winner_index: {
        type: Number,
        required: [true, 'Name field is required.']
    }
})

// Creating a table within database with the defined schema
const Record = mongoose.model('record', RecordSchema)

// Exporting table for querying and mutating
module.exports = Record