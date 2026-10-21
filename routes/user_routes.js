import express from 'express'
import {user_repo , authservice} from '../service/container.js'

import Joi from 'joi';

const registerSchema  = Joi.object({
    name : Joi.string().min(3).required(),
    email : Joi.string().email().required(),
    password : Joi.string().min(8).required()
})
const loginSchema  = Joi.object({

    email : Joi.string().email().required(),
    password : Joi.string().min(8).required()
})

const router = express.Router()

router.get("/", async (req , res , next)=>{

    try {
        const users = await user_repo.findAll({
            select:{
                id:true,
                name:true,
                email:true
            
            }
        })
        res.status(200).json({
            'mssg':"success",
            users
        })
    } catch (error) {
        next(error)
    }
})

router.post("/register",async (req,res , next)=>{
    try {
        const val = await registerSchema.validateAsync(req.body,{abortEarly:false})
        
        const user = await authservice.register(req.body)

        if (user.success){
            res.status(200).json({
                mssg:"user created successfully",
                user:user.safe_user
            })
        }else if (user.exist){
            res.status(200).json({mssg:user.mssg,
                data:user.user,

            })
        }else{

            res.status(400).json({
                mssg:"user is not created",
                mssg_description:user
            })
        }
        
        
    } catch (error) {
        console.log(error)
         if (error.isJoi) {
      res.status(400).json({
        message: 'Validation error',
        details: error.details.map((err) => err.message)
      });
    }
    // Handle other unexpected errors (like database issues)
     res.status(500).json({ message: 'Internal server error',
        err:error
     });
        
    }
})

router.post("/login",async (req,res , next)=>{
    try {
        const val = await loginSchema.validateAsync(req.body,{abortEarly:false})
        
        const user = await authservice.login(req.body)

       if (user.success){
        res.status(200).json({
            mssg:"succefully logged in ",
            user :user.user,
        token:user.token        })
       }else{
        const error = user.err
        throw error
       }
        
    } catch (error) {
        console.log(error)
         if (error.isJoi) {
      res.status(400).json({
        message: 'Validation error',
        details: error.details.map((err) => err.message)
      });
    }
    // Handle other unexpected errors (like database issues)
     res.status(500).json({ 
        err:error
     });
        
    }
})


export default router