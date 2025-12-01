/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import axios from "axios"

import Skeleton from "react-loading-skeleton";

import { RoundedButton } from "../Buttons/Buttons";
import { MenuButton } from "../Icons/Icons";
import "./topBar.css";

import { AppContext } from "../../App";

import ConnectWallet from "../ConnectWallet/ConnectWallet"
import NewProjectDialog from "../Dialogs/NewProjectDialog"
import { ellipsisAddress } from "../../utils/methods"

import * as ENV from "../../config/env"

import logoIcon from "../../assets/imgs/mark.png"
import logoTextIcon from "../../assets/imgs/mark_text.png"
import bitcoin from "../../assets/imgs/ic_bitcoin.png"
import ether from "../../assets/imgs/ic_ether.png"
import sol from "../../assets/imgs/ic_sol.png"
import { GradientDiv } from "../Primary/Elements";
import { FaAngleDown, FaAngleUp, FaArrowDown, FaArrowUp } from "react-icons/fa";
import { RxTriangleDown, RxTriangleUp } from "react-icons/rx";

const TopBar = ({ noProject = false }) => {
  const chainId = useChainId();
  const {
    loadAllProjects,
    projects,
    currentProject,
    setCurrentProject,
    tokenInfo,
    setShowMenu,
    sigData,
    signingData,
    bitcoinInfo,
    etherInfo,
    solInfo
  } = useContext(AppContext);

  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [toggle, setToggle] = useState(false)

  const handleCreateNewProject = async (name, address, paymentId, selfToken) => {
    console.log("Creating new project...", name);
    try {
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/project/create`,
        {
          name: name,
          paymentId,
          selfToken,
          address,
          chainId: chainId,
          sigData,
          signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(data);

      return {
        projectId: data.project._id,
        depositWallet: data.project.depositWallet.address,
        projectTokenAmount: data.project.projectTokenAmount,
        expireTime: data.expireTime,
        qrcode: data.project.qrcode
      };
    }
    catch (err) {
      return { error: err };
    }
  };

  const handleCheckNewProject = async (projectId) => {
    console.log("Checking new project...", projectId);
    try {
      const { data } = await axios.post(`${ENV.SERVER_URL}/api/v1/project/check-status`,
        {
          projectId,
          sigData,
          signingData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (data.success) {
        return {
          activated: true,
        };
      }
      else {
        return {
          expired: data.expired,
          expireTime: data.expireTime,
        }
      }
    }
    catch (err) {
      return { error: err };
    }
  };

  const handleDoneCreatingNewProject = () => {
    setNewProjectDialog(false);
    loadAllProjects();
  };

  return (
    <div className="max-w-full min-w-[1500px] w-full h-8 flex items-center justify-between gap-10">
      <div className="h-full flex-[5] flex flex-row gap-5 items-center">
        {!noProject && <div className="h-full flex gap-2 items-center">
          <MenuButton onClick={() => setShowMenu(true)} />
        </div>}
        {
          !noProject ?
            <div className="h-full flex flex-row gap-2">
              {/* <RoundedButton onClick={() => setNewProjectDialog(true)}>Create New Project</RoundedButton> */}
              <div className="relative text-left h-full">
                <RoundedButton onClick={() => setToggle(!toggle)} className={'max-w-[150px] min-w-[100px] h-full flex items-center'}>
                  <div className="w-[30%] grow overflow-hidden text-nowrap text-ellipsis">
                    {Object.keys(currentProject).length === 0 && currentProject.constructor === Object ? "Choose..." : currentProject.name}&nbsp;
                  </div>
                  <img src="/assets/icon/ic_arrow_down.svg" alt="down-arrow"></img>
                </RoundedButton>
                <div className={`${toggle ? "block" : "hidden"} absolute right-0 z-20 mt-2 origin-top-right rounded-md bg-gray-600 w-full bg-container-secondary max-h-[300px] overflow-y-auto`}>
                  <div className="py-1 overflow-auto" role="none">
                    {
                      projects.map((p, idx) => {
                        return (
                          <div
                            className="text-gray-300 px-4 py-2 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-500"
                            key={idx} role="menuitem"
                            onClick={() => { setToggle(false); setCurrentProject(p) }}
                          >
                            {p.name}
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
              <GradientDiv>
                <div className="px-3 flex gap-2">
                  Contract Owner Wallet: {tokenInfo.owner ? ellipsisAddress(tokenInfo.owner, false) : <Skeleton baseColor="#232334" style={{ width: "100px" }} highlightColor="#444157" />}
                </div>
              </GradientDiv>
            </div>
            :
            <div className="h-full text-xl">
              My Account
            </div>
        }
      </div>
      <div className="flex gap-1 items-center">
        <img src={logoIcon} className="w-16" alt="logo1" />
        <img src={logoTextIcon} className="w-36" alt="logo2" />
      </div>
      <div className="h-full flex-[5] flex flex-row-reverse gap-3 items-center">
        <ConnectWallet />
        <div className="h-full flex gap-1.5">
          <GradientDiv>
            <div className="p-1 flex gap-1 items-center">
              <img className="w-5 h-5" src={bitcoin} alt="bitcoin" />
              BTC:
              <span className={`flex items-center text-xxs ${bitcoinInfo && (bitcoinInfo.direction == 'up' ? 'text-green-light' : 'text-red-normal')}`}>
                ${bitcoinInfo && bitcoinInfo.price}
                {" "}
                {bitcoinInfo && (bitcoinInfo.direction == 'up' ? <RxTriangleUp /> : <RxTriangleDown />)}
              </span>
            </div>
          </GradientDiv>
          <GradientDiv>
            <div className="p-1 flex gap-1 items-center">
              <img className="w-5 h-5" src={ether} alt="ether" />
              ETH:
              <span className={`flex items-center text-xxs ${etherInfo && (etherInfo.direction == 'up' ? 'text-green-light' : 'text-red-normal')}`}>
                ${etherInfo && etherInfo.price}
                {" "}
                {etherInfo && (etherInfo.direction == 'up' ? <RxTriangleUp /> : <RxTriangleDown />)}
              </span>
            </div>
          </GradientDiv>
          <GradientDiv>
            <div className="p-1 flex gap-1 items-center">
              <img className="w-5 h-5" src={sol} alt="sol" />
              SOL:
              <span className={`flex items-center text-xxs ${solInfo && (solInfo.direction == 'up' ? 'text-green-light' : 'text-red-normal')}`}>
                ${solInfo && solInfo.price}
                {" "}
                {solInfo && (solInfo.direction == 'up' ? <RxTriangleUp /> : <RxTriangleDown />)}
              </span>
            </div>
          </GradientDiv>
        </div>
      </div>
      <NewProjectDialog isOpen={newProjectDialog}
        createProject={handleCreateNewProject}
        checkProject={handleCheckNewProject}
        onDone={handleDoneCreatingNewProject}
        onCancel={() => setNewProjectDialog(false)}
        initialData={{ step: -1, projectName: "" }} />
    </div>
  );
};

export default TopBar;
