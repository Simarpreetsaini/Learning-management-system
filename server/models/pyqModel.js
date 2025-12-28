const mongoose = require('mongoose')
require('dotenv').config()


const pyqSchema = new mongoose.Schema({

    pyqfile : {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    department : {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
    },
    pyqfilename : {
        type: String,
        required : true,
    }

})

const Pyq = mongoose.model("Pyq", pyqSchema)
module.exports = Pyq