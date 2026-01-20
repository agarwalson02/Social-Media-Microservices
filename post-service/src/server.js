require("dotenv").config();
const express=require("express")
const mongoose=require("mongoose")
const app=express()
const redis=require("ioredis")
const cors=require("cors")
const helmet=require("helmet")
const postRoutes=require("./routes/post-routes")
const errorHandler=require("./middlewares/errorHandler")
const logger=require("./utils/Logger")
const RedisStore=require('rate-limit-redis').default
const { rateLimit } = require("express-rate-limit")


const port=process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("Connected to MongoDB")
}).catch((error)=>{
    console.log("Error connecting to MongoDB",error)
})

const redisClient=new redis(process.env.REDIS_URL)

//middleware
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

//ip based rate limiting

const sensitiveEndpointsLimiter=rateLimit({
    windowMs:10*60*1000,
    max:10,
    standardHeaders:true,
    legacyHeaders:false,
    handler: (req,res)=>{
        logger.warn("Rate limit exceeded")
        return  res.status(429).json({message:"Too many requests"}) 
    },
    store: new RedisStore({
        sendCommand: (...args)=>redisClient.call(...args)
    })
})

//routes
app.use("/api/posts",(req,res,next)=>{
    req.redisClient=redisClient
    next()
},postRoutes)

app.use(errorHandler)


app.listen(port,()=>{
    logger.info(`Server running on port ${port}`)
})

//unhandled promise rejections
process.on("unhandledRejection",(reason,promise)=>{
    logger.error("Unhandled promise rejection",reason)
})