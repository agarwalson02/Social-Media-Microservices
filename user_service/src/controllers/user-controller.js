const logger=require("../utils/Logger.js")
const {validateRegistration, validateLogin}=require("../utils/validation.js")
const User=require("../models/User.js")
const generateToken=require("../utils/generateToken.js")
const RefreshToken=require("../models/RefreshToken.js")

//user registration

const registerUser =async(req,res)=>{
    
        logger.info("Registration point hit")
    try { 
        const{error}=validateRegistration(req.body)
        if(error){
            logger.warn("Validation error",error.details[0].message )
            return res.status(400).json({message: error.details[0].message})
        }

        const {username,email,password}=req.body
        let user=await User.findOne({$or:[{email},{username}]});
        if(user){
            logger.warn("User already exists")
            return res.status(400).json({message:"User already exists"})
        }
        user=new User({username,email,password})
        await user.save()
        logger.warn("User registered successfully",user._id);
        
        const {accessToken,refreshToken}=await generateToken(user);

        res.status(201).json({message:"User registered successfully",accessToken,refreshToken})
        
    } catch (error) {
        logger.error("Registration failed",error)
        res.status(500).json({message:"Registration failed"})
    }
}

//user login
const loginUser=async(req,res)=>{
    logger.info("Login point hit")
    try {
        const {error}=validateLogin(req.body)
        if(error){
            logger.warn("Validation error",error.details[0].message )
            return res.status(400).json({message: error.details[0].message})
        }
        const {email,password}=req.body
        let user=await User.findOne({email})
        if(!user){
            logger.warn("User not found")
            return res.status(404).json({message:"User not found"})
        }
        const isMatch=await user.comparePassword(password)
        if(!isMatch){
            logger.warn("Invalid password")
            return res.status(401).json({message:"Invalid password"})
        }
        const {accessToken,refreshToken}=await generateToken(user);
        res.status(200).json({message:"Login successful",accessToken,refreshToken,userID: user._id})
    } catch (error) {
        logger.error("Login failed",error)
        res.status(500).json({message:"Login failed"})
    }
}

//refresh token
const refreshTokenUser=async(req,res)=>{
    logger.info("Refresh token point hit")
    try {
        const {refreshToken}=req.body;
        if(!refreshToken){
            logger.warn("Refresh token not found")
            return res.status(400).json({message:"Refresh token not found"})
        }

        const storedToken=await RefreshToken.findOne({token:refreshToken})
        if(!storedToken || storedToken.expiresAt <new Date()){
            logger.warn("Invalid expired refresh token")
            return res.status(401).json({message:"Invalid expired refresh token"})
        }
        const user=await User.findById(storedToken.user)
        if(!user){
            logger.warn("User not found")
            return res.status(404).json({message:"User not found"})
        }
        const {accessToken: newAccessToken,refreshToken: newRefreshToken}=await generateToken(user);
        await RefreshToken.deleteOne({_id:storedToken._id})

        res.status(200).json({
            message:"Refresh token successful",
            accessToken:newAccessToken,
            refreshToken:newRefreshToken
        })
    } catch (error) {
        logger.error("Refresh token failed",error)
        res.status(500).json({message:"Refresh token failed"})
    }
}

//logout
const logoutUser=async(req,res)=>{
    logger.info("Logout point hit")
    try {
        const {refreshToken}=req.body;
        if(!refreshToken){
            logger.warn("Refresh token not found")
            return res.status(400).json({message:"Refresh token not found"})
        }
        const storedToken=await RefreshToken.findOne({token:refreshToken})
        if(!storedToken || storedToken.expiresAt< new Date()){
            logger.warn("Invalid expired refresh token")
            return res.status(401).json({message:"Invalid expired refresh token"})
        }
        await RefreshToken.deleteOne({_id:storedToken._id})
        res.json({message:"Logout successful"})
    } catch (error) {
        logger.error("Logout failed",error)
        res.status(500).json({message:"Logout failed"})
    }
}


module.exports={
    registerUser,
    loginUser,
    refreshTokenUser,
    logoutUser
}