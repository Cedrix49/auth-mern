import React, {useContext, useEffect} from 'react'
import { assets } from '../assets/assets.js'
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Navbar = () => {
    //navigate to other pages
    const navigate = useNavigate();
    //get user data from context
    const {userData, backendUrl, setUserData, setIsLoggedIn} = useContext(AppContent)
    //Send verification otp
    const sendVerificationOtp = async () => {
        //set axios default to true
        try {
            //send request to backend
            axios.defaults.withCredentials = true
            //api call to send verification otp
            const {data} = await axios.post(backendUrl + '/api/auth/send-verify-otp')
            //if verification otp is sent successfully, navigate to verify email page   
            if(data.success) {
                navigate('/email-verify')
                toast.success(data.message)
            //if verification otp is not sent successfully, show toast
            } else {
                toast.error(data.message)
            }
        //if error, show toast
        } catch (error) {
            toast.error(error.message)
        } 
    }
    //logout function
    const logout = async () => {
        //set axios defaults to true
        try {
            axios.defaults.withCredentials = true
            //send logout request to backend
            const { data } = await axios.post(backendUrl + '/api/auth/logout')
            //if logout is successful, set isLoggedIn to false and userData to false
            data.success && setIsLoggedIn(false)
            data.success && setUserData(false)
            //navigate to home page
            navigate('/')
        } catch (error) {
            toast.error(error.message)
        }
    }

  return (
        <div className='w-full flex justify-between items-center 
                        p-4 sm:p-6 sm:px-24 absolute top-0'>
            <img src={assets.logo} alt="logo" className='w-28 sm:w-32'
            />
            {userData ? 
            <div className="w-8 h-8 flex justify-center items-center rounded-full bg-black text-white 
                            relative group">
                {userData.name[0].toUpperCase()}
                <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
                    <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
                        {!userData.isAccountVerified && 
                        <li onClick={sendVerificationOtp} className="cursor-pointer py-1 px-2 hover:bg-gray-200">Verify Email</li>
                        }
                        <li onClick={logout} className="cursor-pointer py-1 px-2 hover:bg-gray-200 pr-10">Logout</li>
                    </ul>
                </div>
            </div> 
            :   <button onClick={() => navigate('/login')}
                        className='cursor-pointer flex items-center gap-2 border 
                                   border-gray-500 rounded-full px-6 py-2
                                   text-gray-800 hover:bg-gray-100 transition-all'>
                Login <img src={assets.arrow_icon} alt="arrow" className='w-4' />
                </button>
            }
        </div>  
    )
}

export default Navbar