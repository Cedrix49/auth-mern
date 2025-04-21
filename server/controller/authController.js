import userModel from "../models/userModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js";

//Register user
export const register = async (req, res) => {

    //Get user data from request body
    const { name, email, password } = req.body;

    //Check if all fields are provided  
    if (!name || !email || !password) {
        return res.json({
            success: false,
            message: 'All fields are required',
        })
    }
    
    //Try to register user
    try {
        //Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if(existingUser) {
            return res.json({
                success: false,
                message: 'User already exists',
            })
        }

        //If user does not exist, hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //Create user
        const user = new userModel({
            name,
            email,
            password: hashedPassword,
        });
        await user.save();

        //Generate token
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        //Cookie store token in browser
        res.cookie('token', token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',  
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })


        //Send email to user
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to our app',
            text: `Welcome ${name} to our app. Your account has been
            succesfully created with email id: ${email}. Please login to your account to continue.` 
        }

        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
        });

    //If error, return error message
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        })
    }
}   

//Login user
export const login = async (req, res) => {
    //Get user data from request body
    const { email, password } = req.body;

    //Check if all fields are provided  
    if (!email || !password) {
        return res.json({
            success: false,
            message: 'Email and password are required',
        })
    }       

    //Try to login user
    try {
        //Check if user exists
        const user = await userModel.findOne({ email });
        if(!user) {
            return res.json({
                success: false,
                message: 'Invalid email',
            })
        }
        
        //Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);

        //If password is incorrect, return error message
        if(!isMatch){
            return res.json({
                success: false,
                message: 'Invalid password',
            })
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',  
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({
            success: true,
        });

    //If error, return error message
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })  
    }
}

//Logout user
export const logout = async (req, res) => {
    //Try to logout user
    try {
        //Clear cookie
        res.clearCookie('token', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',  
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: 'Logged out successfully',
        });

    //If error, return error message
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })
    }
}

//Send verify OTP
export const sendVerifyOtp = async (req, res) => {
    
    //Try to send verify otp
    try {
        //Get user id from request body
        const userId = req.user.id;

        //Check if user exists
        const user = await userModel.findById(userId);

        //Check if user is already verified
        if(user.isAccountVerified) {
            return res.json({
                success: false,
                message: 'Account already verified',
            })  
        }

        //If user exists and is not verified, generate 6 digit otp
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        //Update user with otp
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 *1000;
        
        //Save user
        await user.save();
        
        //Send email to user
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Verify your email',
            // text: `Your OTP is ${otp}. Please verify your email by entering this otp in the website. 
            // This otp will expire in 24 hours.`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }

        //Send email
        await transporter.sendMail(mailOptions);

        //Return success message
        return res.json({
            success: true,
            message: "Verification OTP sent to your email",
        });
        
    //If error, return error message
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })
    }
}

//Verify email
export const verifyEmail = async (req, res) => {
    //Get user id and otp from request body
    const userId = req.user.id;
    const {otp} = req.body;

    //Check if all fields are provided
    if(!userId || !otp) {
        return res.json({   
            success: false,
            message: 'Missing some details',
        })
    }

    //Try to verify email
    try {
        //Get user by id
        const user = await userModel.findById(userId);

        //Check if user exists
        if(!user) {
            return res.json({
                success: false,
                message: 'User not found',
            })
        }

        //Check if otp is correct
        if(user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({
                success: false,
                message: 'Invalid OTP',
            })
        }
        
        //Check if otp is expired
        if(user.verifyOtpExpireAt < Date.now()) {
            return res.json({
                success: false,
                message: 'OTP Expired',
            })
        }

        //Update user with verified status
        user.isAccountVerified = true;
        //Clear otp
        user.verifyOtp = '';
        //Clear otp expire time
        user.verifyOtpExpireAt = 0;

        //Save user
        await user.save();

        //Return success message
        return res.json({
            success: true,
            message: 'Email verified successfully',
        });

    //If error, return error message
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })
    }
}

//Check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({
            success: true,
            message: 'User is authenticated',
            userId: req.user?.id

        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })
    }
}

//Send password reset otp
export const sendResetOtp = async (req, res) => {
    //Get email from request body
    const {email} = req.body;

    //Check if email is provided
    if(!email) {
        return res.json({
            success: false,
            message: 'Email is required',
        })
    }

    try {
        //Get user by email
        const user = await userModel.findOne({email});

        //Check if user exists
        if(!user) {
            return res.json({
                success: false,
                message: 'User not found',
            })
        }

        //Generate 6 digit otp
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        //Update user with otp
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 *1000;
        
        //Save user
        await user.save();

        //Send email to user
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            // text: `Your OTP for password reset is ${otp}. Please reset your password by entering this otp in the website. 
            // This otp will expire in 15 minutes.`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }

        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: 'Password reset OTP sent to your email',
        })

    //If error, return error message
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        })
    }
}

//Reset user password
export const resetPassword = async (req, res) => {
    //Get user email, otp, and new password
    const {email, otp, newPassword} = req.body;

    //Check if email, otp, and new password are provided
    if(!email || !otp || !newPassword) {
        return res.json({
            success: false,
            message: 'All fields are required',
        })
    }

    //Try to reset password
    try {
        //Get user by email
        const user = await userModel.findOne({email});

        //Check if user exists
        if(!user) {
            return res.json({
                success: false,
                message: 'User not found',
            })
        }
        
        //Check if otp is correct
        if(user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({
                succes: false,
                message: "Invalid OTP"
            });
        }

        //Check if otp is expired
        if(user.resetOtpExpireAt < Date.now()) {
            return res.json({
                success: false,
                message: 'OTP expired',
            })
        }

        //Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        //Update user with new password
        user.password = hashedPassword;
        //Clear otp
        user.resetOtp = '';
        //Clear otp expire time
        user.resetOtpExpireAt = 0;

        //Save user
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset successfully',
        })

    
    //If error, return error message
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}