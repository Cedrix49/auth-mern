import jwt from 'jsonwebtoken';
import User from '../models/userModel';

//Middleware to check if user is authenticated
const userAuth = async (req, res, next) => {

    //Get token from cookies
    const token = req.cookies;
    

    if(!token) {
        return res.json({
            success: false,
            message: "Not authorized, please login again"
        })
    }

    //Verify token
    try {
        //Verify token
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        //If token is valid, set user in request
        if(tokenDecode.id){
            req.body.userId = tokenDecode.id
        
        //If token is invalid, return error
        } else {
            return res.json({
                success: false,
                message: "Not authorized, please login again"
            })
        }

        //Next middleware
        next();

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export default userAuth;
