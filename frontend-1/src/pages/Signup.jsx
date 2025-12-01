import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { animations, AnimateOnChange } from 'react-animation'
import { toast } from "react-toastify";
import axios from "axios";

import { AppContext } from "../App";
import { HiMiniUserPlus } from "react-icons/hi2";
import { validateEmail } from "../utils/methods";

export default function SignupPage() {
    const { SERVER_URL, setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const email = e.target[0].value;
        const name = e.target[1].value;
        const password = e.target[2].value;

        if (email === "") {
            toast.warn("Please input email");
            return;
        }

        if (!validateEmail(email)) {
            toast.warn("Email is invalid");
            return;
        }

        if (name === "") {
            toast.warn("Please input user name");
            return;
        }

        if (password.length < 8) {
            toast.warn("Password should be longer than 8 characters");
            return;
        }

        setLoadingPrompt("Registering...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/user/register`,
                {
                    name,
                    password,
                    email
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                setOpenLoading(false);
                // setOpenRegistered(true);
                navigate(`/confirm-email/register/${name}`)
            }
            else {
                setOpenLoading(false);
                toast.warn(data.error);
            }
        }
        catch (err) {
            console.log(err);
            setOpenLoading(false);
            toast.warn("Failed to register");
        }
    };

    return (
        <div className={`flex items-center justify-center min-h-screen bg-black-light pb-7`}>
            {/* <RegisteredDialog isOpen={openRegistered} onOK={() => { navigate("/login"); }} /> */}
            <AnimateOnChange durationOut="1000">
            <div 
                className="relative max-sm:w-[450px] m-6 max-w-[500px] w-full p-3 rounded-xl bg-container shadow-lg shadow-light-purple"
                style={{animation: animations.bounceIn}}
            >
                <HiMiniUserPlus className="text-[50px] text-[#A135F8] mb-1 mx-auto" />
                <h2 className="text-lg font-bold text-white uppercase text-center">Register</h2>
                <p className="mb-5 text-sm text-gray-normal text-center">Enter your email, name and password to register</p>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="">
                        <div className="text-xs uppercase text-gray-normal mb-1">
                            Email<span className="pl-1 text-[#A135F8]">*</span>
                        </div>
                        <div className="bg-purple2-gradient p-[1px] rounded-lg">
                        <input
                            id="email"
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-black-light w-full h-button rounded-lg focus:border-dark-purple"
                            placeholder="Enter your email"
                        />
                        </div>
                    </div>
                    <div className="">
                        <div className="text-xs uppercase text-gray-normal mb-1">
                            Name<span className="pl-1 text-[#A135F8]">*</span>
                        </div>
                        <div className="bg-purple2-gradient p-[1px] rounded-lg">
                        <input
                            id="name"
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-black-light w-full h-button rounded-lg focus:border-dark-purple"
                            placeholder="Enter your name"
                        />
                        </div>
                    </div>
                    <div className="">
                        <div className="text-xs uppercase text-gray-normal mb-1">
                            Password<span className="pl-1 text-[#A135F8]">*</span>
                        </div>
                        <div className="bg-purple2-gradient p-[1px] rounded-lg">
                            <input
                                id="password"
                                type="password"
                                className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-black-light w-full h-button rounded-lg focus:border-dark-purple"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>
                    <div className="flex justify-center w-full gap-2">
                        <button
                            type="submit"
                            className="text-xs font-medium text-center text-white uppercase px-6 h-10 justify-center items-center gap-2.5 inline-flex bg-gradient-to-br from-[#4B65F1] to-[#A135F8] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none w-full rounded-lg"
                        >
                            Register
                        </button>
                    </div>
                </form>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-normal">
                    <p>
                        Already have an account?&nbsp;
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
