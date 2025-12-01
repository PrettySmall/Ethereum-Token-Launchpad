/* eslint-disable react/no-unescaped-entities */
import { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { animations, AnimateOnChange } from 'react-animation'
import axios from "axios";

import { AppContext } from "../App";
import { RiLockPasswordFill } from "react-icons/ri";

import { validateEmail } from "../utils/methods";

export default function ForgotPasswordPage() {
    const navigate = useNavigate()

    const { SERVER_URL, setLoadingPrompt, setOpenLoading } = useContext(AppContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const email = e.target[0].value;

        if (!validateEmail(email)) {
            toast.warn("This email is invalid.")
            return
        }

        setLoadingPrompt("Confirming your email...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/user/forgot-password`,
                {
                    email,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                setOpenLoading(false)
                navigate(`/confirm-email/forgot/${data.name}`)
            }
            else {
                setOpenLoading(false)
                toast.warn(data.error);
            }
        }
        catch (err) {
            console.log(err);
            setOpenLoading(false);
            toast.warn("Failed to reset password");
        }
    };

    return (
        <div className={`flex items-center justify-center min-h-screen bg-black-light pb-7`}>
            <AnimateOnChange durationOut="1000">
            <div 
                className="relative max-sm:w-[450px] m-6 max-w-[500px] w-full p-3 rounded-xl bg-container shadow-lg shadow-light-purple"
                style={{animation: animations.bounceIn}}
            >
                <RiLockPasswordFill className="text-[50px] text-[#A135F8] mb-1 mx-auto" />
                <h2 className="text-lg font-bold text-white uppercase text-center">Forgot your password?</h2>
                <p className="mb-5 text-sm text-gray-normal text-center">Enter your registered email</p>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="">
                        <div className="bg-purple2-gradient p-[1px] rounded-lg">
                        <input
                            id="email"
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-black-light w-full h-button rounded-lg focus:border-green-normal"
                            placeholder="Enter your email"
                        />
                        </div>
                    </div>
                    <div className="flex justify-center w-full gap-2">
                        <button
                            type="submit"
                            className="text-xs font-medium text-center text-white uppercase px-6 h-10 justify-center items-center gap-2.5 inline-flex bg-gradient-to-br from-[#4B65F1] to-[#A135F8] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none w-full rounded-lg"
                        >
                            Confirm
                        </button>
                    </div>
                </form>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-normal">
                    <p>
                        Don't have an account?&nbsp;
                        <Link to="/register" className="bg-clip-text bg-purple2-gradient hover:underline">
                            Register
                        </Link>
                    </p>
                    <p>
                        <Link to="/login" className="bg-clip-text bg-purple2-gradient hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
            </AnimateOnChange>
        </div>
    );
}
