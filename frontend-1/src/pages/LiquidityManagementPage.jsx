import { Card } from "../components/Card/Card";
import BlackList from "../components/ContractManagement/BlackList";
import EnableTrading from "../components/ContractManagement/EnableTrading";
import ExcludeFromMaxTransaction from "../components/ContractManagement/ExcludeFromMaxTransaction";
import ExcludeFromTaxes from "../components/ContractManagement/ExcludeFromTaxes";
import MaxTransactionAmount from "../components/ContractManagement/MaxTransactionAmount";
import MaxWalletAmount from "../components/ContractManagement/MaxWalletAmount";
import ModifyTax from "../components/ContractManagement/ModifyTax";
import RemoveLimits from "../components/ContractManagement/RemoveLimits";
import RenounceOwnership from "../components/ContractManagement/RenounceOwnership";
import TransferOwnership from "../components/ContractManagement/TransferOwnership";
import TopBar from "../components/TopBar/TopBar";
import etherIcon from '../assets/images/ethereum.svg'
import AddRemoveLiquidity from "../components/LiquidityManagement/AddRemoveLiquidity";
import LiquidityLockWithdraw from "../components/LiquidityManagement/LiquidityLockWithdraw";
import AdvancedModal from "../components/Dialogs/AdvancedModal";
import { useState } from "react";

const LiquidityManagementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
      <div className="z-flex flex-col items-center mx-6 my-3">
        <TopBar />
        <div className="mx-auto max-w-[1000px] px-10">
          <div className="mt-8 mb-4 flex justify-center items-center gap-4">
            <span className="font-conthrax text-lg font-medium text-white">Liquidity Management</span>
            <img className="w-6 h-6" src="/assets/icon/ic_info.svg" onClick={() => setIsOpen(true)} />
          </div>
          <div className="mx-auto w-[500px] text-gray-label">Our Liquidity Management feature allows users to seamlessly manage liquidity directly from our platform, leveraging trusted third-party protocols:</div>
        </div>
        <div className="mx-auto max-w-[1400px] flex gap-6 my-6 justify-center">
          <Card className="!w-1/2 !p-6 flex flex-col gap-6 rounded-3xl border-4 border-card-border">
            <AddRemoveLiquidity />
          </Card>
          <Card className="!w-1/2 !p-6 flex flex-col gap-6 rounded-3xl border-4 border-card-border">
            <LiquidityLockWithdraw />
          </Card>
        </div>
      </div>
      <AdvancedModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="w-[515px] h-[568px] p-8 flex flex-col items-center gap-5">
          <div className="text-lg font-conthrax">Liquidity Management</div>
          <div className="text-left text-white/70">
            {"MemeTools's Liquidity Management Feature:"}<br />
            <br />
            {"Our Liquidity Management feature page allows users to seamlessly manage liquidity directly from our platform, leveraging trusted third-party protocols:"}<br />
            <br />
            <ul className="list-disc">
              <li className="ml-5">{"Add Liquidity: Use Uniswap to provide liquidity to the pool by adding tokens and corresponding assets."}</li>
              <li className="ml-5">{"Remove Liquidity: Easily withdraw your liquidity from Uniswap when needed."}</li>
              <li className="ml-5">{"Lock Liquidity: Secure your liquidity using Unicrypt, ensuring it remains locked for a specified duration to build trust and stability for your project."}</li>
              <li className="ml-5">{"Unlock/Withdraw Liquidity: After the lock period ends, you can unlock and withdraw your liquidity via Unicrypt."}</li>
            </ul>
            <br />
            {"This integration makes liquidity management straightforward, with everything accessible from one platform."}
          </div>
        </div>
      </AdvancedModal>
    </div>
  );
};

export default LiquidityManagementPage;
