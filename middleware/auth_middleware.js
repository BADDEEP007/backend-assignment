import jwt from 'jsonwebtoken';



export function  authenticate(req , res , next){
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            mssg :'Auth token is required '
        })
    }


    const token = authHeader.split(" ")[1]
    const secret = process.env.JWT_SECRET
    try {
        const payload = jwt.verify(token , secret )
        req.auth = {
            userId:payload.sub,
            role :payload.role
        }
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            success:false,
            mssg :"invalid or expired token"
        })
    }
}


export function authorize(...allowedRoles){
    return (req,res,next)=>{
        if (!req.auth){
            return res.status(401).json({
                success:false,
                mssg :"Auth is requires"
            })
        }
        if (!allowedRoles.includes(req.auth.role)){
            return res.status(403).json({
                success:false,
                message:"insuffucent permission"
            })
        }
        next()
    }
}
