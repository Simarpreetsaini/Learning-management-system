const mongoose = require('mongoose')
require('dotenv').config()

const hotlinkSchema = new mongoose.Schema ({

    linktext: {
        type: String,
        required: true,
    },
    linkaddress: {
        type: String,
        required: true,
    },

})

const hotlink = mongoose.model("hotlink", hotlinkSchema)
module.exports = hotlink