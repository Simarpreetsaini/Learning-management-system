const mongoose = require('mongoose')
require('dotenv').config()

const impdocSchema = new mongoose.Schema ({

    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: false,
    },
    impdocument : {
        type: String,
        required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    }

})


const impdoc = mongoose.model("important_document", impdocSchema)
module.exports = impdoc