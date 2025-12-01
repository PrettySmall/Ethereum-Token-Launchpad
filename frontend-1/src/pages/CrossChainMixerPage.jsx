import TopBar from "../components/TopBar/TopBar";

const CrossChainMixerPage = () => {
  return (
    <div className="w-screen h-screen flex flex-col max-[1800px]:items-start items-center overflow-auto">
      <div className="mx-6 w-fit h-full pt-5 pb-3 flex flex-col gap-3">
        <TopBar />
        <div className="mx-auto w-[40%] h-[50%] grow my-20 flex flex-col gap-8">
          <img src="/assets/img/swap1.png" className="w-full h-fit object-center" />
          <img src="/assets/img/swap2.png" className="w-full h-fit object-center" />
        </div>
      </div>
    </div>
  );
};

export default CrossChainMixerPage;
