const mongoose = require('mongoose')
require('dotenv').config()

const imageGallerySchema = new mongoose.Schema ({

    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    imageurl : {
        type: String,
        required: false,
    },
    imageFile : {
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

const imageGallery = mongoose.model("image_gallery", imageGallerySchema)
module.exports = imageGallery