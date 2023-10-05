const mongoose = require("mongoose");

// create admin schema
const userSchema = new mongoose.Schema({
    
    
   date:{
        type:Date,
    },
    tithi:{
        type:String,
    },
    rashi:{
        type:String,
    },
    nakshtra:{
        type:String,
    },
    chandroday:{
        type:String,
    },
    vinchudo:{
        type:String,
    },
    panchak:{
        type:String,
    },
    sunrise:{
        type:String,
    },
    sunset:{
        type:String,
    },
    holiday:{
        type:String,
    },
    rutu:{
        type:String,
    },
    description:{
        type:String,
    }
})

const users = new mongoose.model("schedule_list",userSchema);
module.exports = users;