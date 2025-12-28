const mongoose = require('mongoose')
require('dotenv').config()

const eLibSchema = new mongoose.Schema ({

    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    impdocument : {
        type: String,
        required: true,
    },
    fileurl : {
        type: String,
        required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    category : {
        type: String,
        required: true,
    }

})

const eLib = mongoose.model("e_library", eLibSchema)
module.exports = eLib