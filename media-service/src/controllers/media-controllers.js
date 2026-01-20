const logger=require("../utils/Logger")
const Media=require("../models/Media")
const {uploadFileCloudinary}=require("../utils/cloudinary")


const uploadMedia=async(req,res)=>{
    logger.info("Uploading media endpoint hit")
    try {
        if(!req.file){
            logger.error("No file uploaded")
            return res.status(400).json({
                message:"No file uploaded"
            })
        }
        const {originalname,mimetype}=req.file
        const userId=req.user.userId

        logger.info(`File details : name - ${originalname}, type - ${mimetype}, userId - ${userId}`)
        logger.info("Uploading file to cloudinary")

        const result= await uploadFileCloudinary(req.file)
        logger.info(`File uploaded successfully. PublicId  ${result.public_id}`)

        const newMedia=new Media({
            publicId:result.public_id,
            originalName:originalname,
            mimeType:mimetype,
            url:result.secure_url,
            userId:userId 
        })

        await newMedia.save()
        logger.info("Media saved successfully")
        res.status(201).json({
            message:"Media uploaded successfully",
            mediaId:newMedia._id,
            publicId:newMedia.publicId,
            url:newMedia.url
        })
        
    } catch (error) {
        logger.error("Error while uploading media",error)
        res.status(500).json({
            message:"Error while uploading media"
        })
        
    }
}

module.exports={uploadMedia}
