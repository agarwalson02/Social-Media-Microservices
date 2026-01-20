const logger=require('../utils/Logger')
const Post=require('../models/Post')
const { validatePost } = require('../utils/validation')
// const Redis=require("ioredis")
// const redisClient=new Redis(process.env.REDIS_URL)

async function invalidateCache(req,input){
    const keys=await req.redisClient.keys("posts: *")
    const cacheKeys=[`post:${input}`,]
    await req.redisClient.del(cacheKeys);

    if(keys.length>0){
        await req.redisClient.del(keys)
    }
}

const createPost= async(req,res)=>{
    logger.info("Creating post endpoint hit",req.body)
    try {
        const{error}=validatePost(req.body)
        if(error){
            logger.warn("Validation error",error.details[0].message )
            return res.status(400).json({message: error.details[0].message})
        }
        const {content,mediaIDs}=req.body
        const newPost=new Post({
            content,
            user: req.user.userId,
            mediaIds:mediaIDs || []

        })
        await newPost.save();
        await invalidateCache(req,newPost._id.toString())
        logger.info("Post created successfully",newPost)
        res.status(201).json({message:'Post created successfully',post:newPost})
        
    } catch (error) {
        logger.error('Error creating post',error)
        res.status(500).json({message:'Failed to create post'})
        
    }
}

const getAllPosts= async(req,res)=>{
    try {
        const page=parseInt(req.query.page) || 1;
        const limit=parseInt(req.query.limit)|| 10;
        const startIndex=(page-1)*limit;

        const cacheKey=`posts:${page}:${limit}`
        const cachedPosts=await req.redisClient.get(cacheKey)
        if(cachedPosts){
            logger.info("Posts retrieved from cache")
            return res.status(200).json(JSON.parse(cachedPosts))
        }
        const posts=await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit)
        const total=await Post.countDocuments()
        const totalPages=Math.ceil(total/limit)

        const result={
            posts,
            currentPage:page,
            totalPages:totalPages,
            totalPosts:total
        }

        

        //save your posts
         await req.redisClient.setex (cacheKey,60,JSON.stringify(result));

         res.json(result)
        
    } catch (error) {
        logger.error('Error getting all posts',error)
        res.status(500).json({message:'Failed to get all posts'})
        
    }
}

const getPost= async(req,res)=>{
    try {
        const postId=req.params.id;
        const cacheKey=`post:${postId}`
        const cachedPost=await req.redisClient.get(cacheKey)
        if(cachedPost){
            logger.info("Post retrieved from cache")
            return res.status(200).json(JSON.parse(cachedPost))
        }
        const post=await Post.findById(postId)
        if(!post){
            logger.warn("Post not found")
            return res.status(404).json({message:'Post not found'})
        }
        await req.redisClient.setex(cacheKey,60,JSON.stringify(post))
        res.status(200).json(post)
        
    } catch (error) {
        logger.error('Error getting post',error)
        res.status(500).json({message:'Failed to get post'})
        
    }
}

const deletePost= async(req,res)=>{
    try {

        const post=await Post.findByIdAndDelete({_id:req.params.id,user:req.user.userId})

        if(!post){
            logger.warn("Post not found")
            return res.status(404).json({message:'Post not found'})
        }
        await invalidateCache(req,req.params.id);
        res.json({message:'Post deleted successfully'})
        
    } catch (error) {
        logger.error('Error deleting post',error)
        res.status(500).json({message:'Failed to delete post'})
        
    }
}

module.exports={
    createPost,
    getAllPosts,
    getPost,
    deletePost
}