import userModel from '../models/userModels.js';

//Get user data
export const getUserData = async (req, res) => {

    //Try to get user data
    try {
        //Get user id from request
        const userId = req.userId;

        //Get user data from database
        const user = await userModel.findById(userId);

        //Check if user exists
        if(!user) {
            return res.json({
                success: false,
                message: 'User not found',
            })
        }

        //If user exists, return user data
        res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified,
            }
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })
    }
}
