import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { AppContext } from "../App";
import { RiLockPasswordFill } from "react-icons/ri";
import ResetDialog from "../components/Dialogs/ResetDialog";

export default function ResetPasswordPage() {
    const { name } = useParams()
    const { SERVER_URL, setLoadingPrompt, setOpenLoading } = useContext(AppContext);
    const navigate = useNavigate();
    const [ openResetDlg, setOpenResetDlg ] = useState (false)

    const handleSubmit = async (e) => {
        e.preventDefault();

        const password1 = e.target[0].value; 
        const password2 = e.target[1].value;

        if (!name || name.trim().length === 0) {
            toast.warn ("Username is empty.")
            return
        }

        if (password1 === "") {
            toast.warn("Please input your password");
            return;
        }

        if (password2 === "") {
            toast.warn("Please input your password");
            return;
        }

        if (password1 !== password2) {
            toast.warn("Passwords are not matched.")
            return
        }

        setLoadingPrompt("Resetting password...");
        setOpenLoading(true);
        try {
            const { data } = await axios.post(`${SERVER_URL}/api/v1/user/reset-password`,
                {
                    name,
                    password1,
                    password2
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (data.success) {
                setOpenLoading(false);
                setOpenResetDlg(true);
                toast.success("Reset password successfully!")
            }
            else {
                setOpenLoading(false);
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
            <ResetDialog isOpen={openResetDlg} onOK={() => { navigate("/login"); }} />
            <div className="relative max-sm:w-[450px] m-6 max-w-[500px] w-full">
                <RiLockPasswordFill className="text-[50px] text-[#A135F8] mb-1 mx-auto" />
                <h2 className="text-lg font-bold text-white uppercase text-center">Reset your password</h2>
                <p className="mb-5 text-sm text-gray-normal text-center">Enter your password</p>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="">
                        <input
                            id="password1"
                            type="password"
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg focus:border-green-normal"
                            placeholder="Enter your password"
                        />
                    </div>
                    <div className="">
                        <input
                            id="password2"
                            type="password"
                            className="outline-none border border-gray-border text-white placeholder:text-gray-border text-sm px-2.5 bg-transparent w-full h-button mt-1 rounded-lg focus:border-[#4B65F1]"
                            placeholder="Re-enter your password"
                        />
                    </div>
                    <div className="flex justify-center w-full gap-2">
                        <button
                            type="submit"
                            className="text-xs font-medium text-center text-white uppercase px-6 h-10 justify-center items-center gap-2.5 inline-flex bg-gradient-to-br from-[#4B65F1] to-[#A135F8] active:scale-95 transition duration-100 ease-in-out transform focus:outline-none w-full rounded-lg"
                        >
                            Reset
                        </button>
                    </div>
                </form>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-normal">
                    <p>
                        Go to &nbsp;
                        <Link to="/" className="text-[#4B65F1] hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
