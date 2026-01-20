const express=require("express")
const multer=require("multer")
const {uploadMedia}=require("../controllers/media-controllers")
const authMiddleware=require("../middlewares/authMiddleware")
const logger=require("../utils/Logger")
const router=express.Router()

const upload=multer({
    storage:multer.memoryStorage(),
    limits:{
        fileSize:1024*1024*5
    }
}).single("file")

router.post("/upload",authMiddleware,(req,res,next)=>{
    upload(req,res,err=>{
        if(err instanceof multer.MulterError){
            logger.error("Multer error while uploading media",err)
            return res.status(500).json({
                message:"Multer error while uploading media"
            })
        }else if(err){
            logger.error("Uknown error while uploading media",err)
            return res.status(500).json({
                message:"Uknown error while uploading media"
            })
        }
        if(!req.file){
            logger.error("No file uploaded")
            return res.status(400).json({
                message:"No file uploaded"
            })
        }
        next()
    })
},uploadMedia)

module.exports=router
