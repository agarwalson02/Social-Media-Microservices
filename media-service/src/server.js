require("dotenv").config()
const express=require("express")
const app=express()
const port=process.env.PORT || 3003
const logger=require("./utils/Logger")
const cors=require("cors")
const helmet=require("helmet")
const mediaRoutes=require("./routes/media-routes")
const errorHandler=require("./middlewares/errorHandler")
const mongoose=require("mongoose")
const {rateLimit}=require("express-rate-limit")

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("COnnect to DB")
}).catch(error=>{
    console.log("Failed to connect to DB",error)
})


app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info("Request received",{
        method:req.method,
        url:req.url,
        body:req.body
    })
    next()
})

//IP based rate limiting
const sensitiveEndpointsLimiter=rateLimit({
    windowMs:10*60*1000,
    max:10,
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn("Rate limit exceeded")
        return res.status(429).json({message:"Too many requests"})
    }
})

app.use("/api/media",sensitiveEndpointsLimiter)
app.use("/api/media",mediaRoutes)

app.use(errorHandler)

app.listen(port,()=>{
    logger.info(`Server running on port ${port}`)
})

//unhandled promise rejections
process.on("unhandledRejection",(reason,promise)=>{
    logger.error("Unhandled promise rejection",reason)
})