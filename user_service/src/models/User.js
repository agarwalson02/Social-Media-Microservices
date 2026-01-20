const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
},{
    timestamps:true
})

userSchema.pre("save", async function() {
    if (this.isModified("password")) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            throw error;
        }
    }
});

userSchema.methods.comparePassword=async function(candidatePassowrd){
    try {
        return await argon2.verify(this.password,candidatePassowrd)
    } catch (error) {
        throw error
    }
}

userSchema.index({username:'text'});

const User=mongoose.model('User',userSchema);
module.exports=User;