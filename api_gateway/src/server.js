require("dotenv").config();
const express=require("express")
const cors=require("cors")
const Redis=require("ioredis")
const helmet=require("helmet")
const { rateLimit } = require("express-rate-limit")
const RedisStore = require("rate-limit-redis").default
const logger=require("./utils/Logger")
const app=express()
const PORT=process.env.PORT || 3000
const proxy=require('express-http-proxy')
const errorhandler=require("./middlewares/errorHandler")
const validateToken=require("./middlewares/authMiddleware")

const redisClient=new Redis(process.env.REDIS_URL);

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

//rate limit 
const commonRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn("Rate limit exceeded")
        return res.status(429).json({ message: "Too many requests" })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

app.use(commonRateLimit)


const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api')
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error("Proxy error", err)
        res.status(500).json({ message: "Something failed!" })
    }
}
app.use("/v1/auth", proxy(process.env.USER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from User service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))


app.use("/v1/posts",validateToken,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Post service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

//media
app.use("/v1/media",validateToken,proxy(process.env.MEDIA_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
        if(srcReq.headers['content-type'] && !srcReq.headers['content-type'].startsWith("multipart/form-data")){
            proxyReqOpts.headers['content-type']="application/json"
        }
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Media service: ${proxyRes.statusCode}`)
        return proxyResData
    },parseReqBody:false
}))

app.use(errorhandler);
app.listen(PORT,()=>{
    logger.info(`Server running on port ${PORT}`)
    logger.info(`User service is running on ${process.env.USER_SERVICE_URL}`)
    logger.info(`Post service is running on ${process.env.POST_SERVICE_URL}`)
    logger.info(`Media service is running on ${process.env.MEDIA_SERVICE_URL}`)
})