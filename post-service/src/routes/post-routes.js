const express=require('express');
const router=express.Router();
const authMiddleware=require('../middlewares/authMiddleware')

const {createPost,getAllPosts,getPost,deletePost}=require('../controllers/post-controller')

router.use(authMiddleware)
router.post('/create-post',createPost)
router.get('/all-posts',getAllPosts)
router.get('/:id',getPost)
router.delete('/delete/:id',deletePost)
module.exports=router
