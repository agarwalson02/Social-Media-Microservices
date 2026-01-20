    const jwt=require("jsonwebtoken")
    const crypto=require("crypto")
    const RefreshToken=require("../models/RefreshToken")

    const generateToken=async(user)=>{
        const accessToken=jwt.sign({
            userId:user._id,
            username:user.username,
            email:user.email    
        },process.env.JWT_SECRET,{
            expiresIn:"1h" 
        })
        const refreshToken=crypto.randomBytes(40).toString("hex")
        const expiresAt=new Date(Date.now()+7*24*60*60*1000)
        await RefreshToken.create({
            token:refreshToken,
            user:user._id,
            expiresAt:expiresAt
        })
        return {accessToken,refreshToken}
    }
    module.exports=generateToken


