const joi=require("joi")

const validateRegistration=(user)=>{
    const schema=joi.object({
        username:joi.string().alphanum().min(3).max(30).required(),
        email:joi.string().email().required(),
        password:joi.string().min(6).required()   
     })
    return schema.validate(user)
}

const validateLogin=(user)=>{
    const schema=joi.object({
        email:joi.string().email().required(),
        password:joi.string().min(6).required()   
     })
    return schema.validate(user)
}
module.exports={
    validateRegistration,
    validateLogin
}