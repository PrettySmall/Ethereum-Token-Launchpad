import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { AppContext } from "../App";
import RegisteredDialog from "../components/Dialogs/RegisteredDialog";
import { RiPassValidFill } from "react-icons/ri";

export default function ConfirmOtpPage() {
    const { action, name } = useParams()
    const { SERVER_URL, setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const navigate = useNavigate();
    const [intervalId, setIntervalId] = useState (null)
    const [openRegistered, setOpenRegistered] = useState(false);

    const handleCheck = async(otp) => {
        const interval = setInterval(async() => {
            try {
                const { data } = await axios.post(`${SERVER_URL}/api/v1/user/check-confirmed`,
                    {
                        name,
                        otp,
                        action,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (data.success) {
                    clearInterval(interval)
                    setOpenLoading(false);
                    if (action === "register") {
                        setOpenRegistered(true)
                    } else if (action === 'forgot') {
                        navigate(`/reset-password/${name}`)
                    }
                }
            } catch (err) {
                clearInterval (interval)
                toast.warn ("Failed in confirm!")
                setOpenLoading (false)
                navigate("/register")
                if (action === "register") {
                    navigate("/register")
                } else if (action === 'forgot') {
                    navigate("/login")
                }
            }
        }, [3000])
        setIntervalId(interval)
    }
    
    const handleChange = async (e) => {
        e.preventDefault();

        const otpValue = e.target.value;
        if (otpValue.length !== 6) {
            return
        }

        setLoadingPrompt("Confirming your email...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/user/save-otp`,
                {
                    otp: otpValue,
                    name,
                    action
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!data.success) {
                setOpenLoading(false);
                toast.warn(data.error)
                return
            }
            handleCheck(otpValue)
        }
        catch (err) {
            console.log(err);
            setOpenLoading(false);
            toast.warn("Failed to confirm");
        }
    };

    const handleOK = () => {
        clearInterval (intervalId)
        navigate("/login")
    }

    return (
        <div className={`flex items-center justify-center min-h-screen bg-black-light pb-7`}>
            <RegisteredDialog isOpen={openRegistered} onOK={handleOK} />
            <div className="relative max-sm:w-[450px] m-6 max-w-[500px] w-full">
                <RiPassValidFill className="text-[50px] text-[#A135F8] mb-1 mx-auto" />
                <h2 className="text-lg font-bold text-white uppercase text-center">Confirm your email</h2>
                <p className="mb-5 text-sm text-gray-normal text-center">Check your email inbox and enter the 6-digits.</p>
                <div className="space-y-5">
                    <input
                        id="otp"
                        className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg focus:border-[#4B65F1]"
                        placeholder="Enter 6-digits"
                        onChange={handleChange}
                    />
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-normal">
                    <p>
                        Already have an account?&nbsp;
                        <Link to="/login" className="text-[#4B65F1] hover:underline">
                            Login
                        </Link>
                    </p>
                    {/* <p>
                        Go to &nbsp;
                        <Link to="/" className="text-green-normal hover:underline">
                            Home
                        </Link>
                    </p> */}
                </div>
            </div>
        </div>
    );
}
