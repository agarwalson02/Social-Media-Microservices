const logger=require('../utils/Logger')

const authMiddleware=(req,res,next)=>{
    const userID=req.headers["x-user-id"]

    if(!userID){
        logger.warn("Access attempted without authentication")
        return res.status(401).json({message:"Unauthorized , Please Login"})
    }

    req.user={
        userId:userID
    }
    next()
}
module.exports=authMiddleware
