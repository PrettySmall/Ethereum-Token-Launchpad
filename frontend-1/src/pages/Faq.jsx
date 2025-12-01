import { FaQuestion, FaQuestionCircle, FaRegQuestionCircle } from "react-icons/fa";

const Faq = () => {
  const questionAndAnswer = [
    {
      id: "deploy-and-bundle",
      question: "Creating Smart Contract and Bundling Instructions",
      answer: `Creating and deploying your own Smart contract is simple with Meme Tools!<br>
      1. Simply enter your Token information, wallet addresses and tax allocation in the form below. Please only enter integer values for fields that require a number (Tax).<br>
      2. Add Tokens and ETH to Liquidity Pool.<br>
      3. Once you’re finished, click “Enable Trading” to allow market purchases.<br>
      <br>
      Creating Smart Contract and Bundling:<br>
      1. Create a New Project.<br>
      2. Select your Bundle Package.<br>
      3. Enter Token Information for New Smart Contract.<br>
      4. Deploy Token & Make Payment For Selected Package.<br>
      5. Add Tokens and ETH To Liquidity Pool.<br>
      6. DO NOT ENABLE TRADING at this stage.<br>
      7. Click Bundler tab, now available on the pop-up window.<br>
      8. Please visit our Gitbook for more detailed instructions on Bundling!`,
    },
  ];
  return (
    <div className="mt-20 w-[900px] flex flex-col gap-8 text-left">
      <div className="flex text-3xl gap-2">
        <FaRegQuestionCircle /> FAQ
      </div>
      {questionAndAnswer.map((item) => {
        return (
          <div
            id={item.id}
            key={item.id}
            className="rounded-xl bg-black/20 p-8 border border-solid border-[#06b6d4] shadow-custom"
          >
            <div className="text-3xl text-white text-left mb-8">
              {item.question}
            </div>
            <div
              className="text-sm text-white text-left leading-8"
              dangerouslySetInnerHTML={{ __html: item.answer }}
            ></div>
          </div>
        );
      })}
    </div>
  );
};

export default Faq;
