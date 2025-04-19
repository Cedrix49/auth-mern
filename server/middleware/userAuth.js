import jwt from 'jsonwebtoken';

//Middleware to check if user is authenticated
const userAuth = async (req, res, next) => {

    //Get token from cookies
    const token = req.cookies.token;
    

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
            req.userId = tokenDecode.id
        
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
