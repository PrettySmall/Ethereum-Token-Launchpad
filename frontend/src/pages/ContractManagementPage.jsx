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

const ContractManagementPage = () => {
  return (
    <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
      <div className="z-flex flex-col items-center mx-6 my-3">
        <TopBar />
        <div className="mx-auto max-w-[1000px] px-10">
          <div className="mt-8 flex justify-center items-center gap-2">
            <img src="/assets/icon/ic_eth.svg" className="w-12 h-12" />
            <span className="font-conthrax text-base font-medium text-white">Contract Management</span>
          </div>
          <div className="text-gray-label">MemeTools's Contract Management feature allows users who deploy contracts using our templates to easily control all available functions directly from a single interface. This eliminates the need to manually interact with Etherscan or make separate function calls.</div>
          <div className="mt-2 text-gray-label">Simply manage your contract’s settings and functions here, ensuring that your contract deployer address has sufficient ETH for gas fees when executing transactions. This streamlined process saves time and simplifies contract management.</div>
        </div>
        <div className="mx-auto max-w-[1400px] flex gap-6 my-6 justify-center">
          <Card className="!w-1/2 !p-6 flex flex-col gap-6 rounded-3xl border-4 border-card-border">
            <EnableTrading />
            <ModifyTax />
            <RemoveLimits />
            <MaxWalletAmount />
            <MaxTransactionAmount />
          </Card>
          <Card className="!w-1/2 !p-6 flex flex-col gap-6 rounded-3xl border-4 border-card-border">
            <ExcludeFromMaxTransaction />
            <ExcludeFromTaxes />
            <BlackList />
            <TransferOwnership />
            <RenounceOwnership />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContractManagementPage;
