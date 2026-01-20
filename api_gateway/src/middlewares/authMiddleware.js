const logger=require("../utils/Logger")
const jwt=require("jsonwebtoken")

const validateToken=(req,res,next)=>{
    const authHeader=req.headers.authorization
    const token=authHeader && authHeader.split(" ")[1]
    if(!token){
        logger.warn("Access attempted without authentication")
        return res.status(401).json({message:"Unauthorized"})
    }

    jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if(err){
            logger.warn("Invalid token")
            return res.status(401).json({message:"Unauthorized"})
        }
        req.user=user
        next()
    })
}

module.exports=validateToken