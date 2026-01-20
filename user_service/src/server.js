require("dotenv").config()
const express=require("express")
const app=express()
const port=process.env.PORT||3000
const helmet=require("helmet") 
const cors=require("cors")
const mongoose=require("mongoose")
const logger=require("./utils/Logger")
const {RateLimiterRedis}=require("rate-limiter-flexible")
const redis=require("ioredis")
const { rateLimit } = require("express-rate-limit")
const RedisStore=require('rate-limit-redis').default
const routes=require("./routes/user-service")
const errorhandler=require("./middlewares/errorHandler")

const PORT=process.env.PORT||3001

//connect to MongoDB    
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


//DDoS Protection
const rateLimiter= new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix:"middleware",
    points:10,
    duration:1
}) 

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip)
    .then(()=>next())
    .catch(()=>{
        logger.warn("Rate limit exceeded")
        return res.status(429).json({message:"Too many requests" })
    })

})

//IP based rate limiter
const sensitiveEndpointsLimiter=rateLimit({
    windowMs: 15*60*1000,
    max:50,
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

//apply sensitive endpoints rate limiter
app.post("/api/auth/register",sensitiveEndpointsLimiter)

//main routes
app.use("/api/auth",routes)

//error handler
app.use(errorhandler)




app.listen(port,()=>{
    logger.info(`Server running on port ${port}`)
})

//unhandled promise rejections
process.on("unhandledRejection",(reason,promise)=>{
    logger.error("Unhandled promise rejection",reason)
})