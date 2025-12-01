/* eslint-disable react/no-unescaped-entities */
import { useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { animations, AnimateOnChange } from 'react-animation'
import axios from "axios";

import { AppContext } from "../App";
import logoIcon from "../assets/imgs/mark.png"
import { IoIosExit } from "react-icons/io";

export default function SigninPage() {
    const { SERVER_URL, setLoadingPrompt, setOpenLoading, setUser } = useContext(AppContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const name = e.target[0].value;
        const password = e.target[1].value;
        if (name === "") {
            toast.warn("Please input user name");
            return;
        }

        if (password === "") {
            toast.warn("Please input password");
            return;
        }

        setLoadingPrompt("Logging in...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/user/login`,
                {
                    name,
                    password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                localStorage.setItem("access-token", data.accessToken);
                setUser(data.user);
                // navigate("/dashboard");
            }
            else
                toast.warn("Failed to register");
        }
        catch (err) {
            console.log(err);
            setOpenLoading(false);
            toast.warn("Failed to login");
        }
    };

    return (
        <div className={`flex items-center justify-center min-h-screen bg-black-light pb-7`}>
            <AnimateOnChange durationOut="1000">
                <div
                    className="relative max-sm:w-[450px] m-6 max-w-[500px] w-full p-3 rounded-xl bg-container shadow-lg shadow-light-purple"
                    style={{animation: animations.bounceIn}}
                >
                    {/* <IoIosExit className="text-[50px] text-[#A135F8] mb-1 mx-auto" /> */}
                    <div className="flex justify-center">
                        <img src={logoIcon} className="w-16 h-16" />
                    </div>
                    <h2 className="text-lg font-bold text-white uppercase text-center">Login</h2>
                    <p className="mb-5 text-sm text-gray-300 text-center">Enter your name and password to login</p>
                    <form className="space-y-5" onSubmit={handleSubmit}>
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
                                Login
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
                            <Link to="/forgot-password" className="bg-clip-text bg-purple2-gradient hover:underline">
                                Forgot password?
                            </Link>
                        </p>
                    </div>
                </div>
            </AnimateOnChange>
        </div>
    );
}
