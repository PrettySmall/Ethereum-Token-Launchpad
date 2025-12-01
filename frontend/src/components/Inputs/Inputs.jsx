import { useEffect, useState } from "react";
import { TEMPLATES } from "../../utils/constants";
import { Listbox } from "@headlessui/react";
import { IoIosArrowDown } from "react-icons/io";

export const Input1 = ({ className, ...other }) => {
  return (
    <input
      type="text"
      className={`h-5 py-1 px-1 rounded-[4px] bg-black-bg-input outline-none border-none hover:outline-1 hover:outline hover:outline-gray-500 flex text-orange placeholder:text-orange ${className}`}
      {...other}
    />
  );
};

export const Input2 = ({ className, ...other }) => {
  return (
    <input
      type="text"
      className={`w-full h-8 py-2 px-2 rounded-[8px] bg-black-bg-input outline-none border-none hover:outline-1 hover:outline hover:outline-gray-500 flex text-xs ${className}`}
      {...other}
    />
  );
};

export const ContractTemplateSelect = ({ onChange }) => {
  const [template, setTemplate] = useState(TEMPLATES[0]);

  useEffect(() => {
    onChange && onChange(template);
  }, [template])

  return (
    <div className="relative w-full">
      <div className="text-left text-gray-label">
        Select Smart Contract Template
        <span className="pl-1 text-white">*</span>
      </div>
      <Listbox value={template} onChange={setTemplate}>
        <Listbox.Button className="outline-none rounded-lg border border-gray-border text-orange placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7">
          <span className="flex items-center">
            <span className="block truncate">{template}</span>
          </span>
          <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-20 w-full overflow-auto border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
          {TEMPLATES.map((item, index) => {
            return (
              <Listbox.Option
                key={index}
                className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === template && "text-white"
                  }`}
                value={item}
              >
                <div className="flex items-center">
                  <span className="block font-normal truncate">
                    {item}
                  </span>
                </div>
              </Listbox.Option>
            );
          })}
        </Listbox.Options>
      </Listbox>
    </div>
  )
}

export const TrueFalseSelect = ({ onChange }) => {
  const options = ["True", "False"];
  const [text, setText] = useState(options[0]);

  useEffect(() => {
    onChange && onChange(text == "True" ? true : false);
  }, [text])

  return (
    <div className="relative w-full">
      <div className="text-left text-gray-label">
        Is Wallet Address Excluded
        <span className="pl-1 text-white">*</span>
      </div>
      <Listbox value={text} onChange={setText}>
        <Listbox.Button className="outline-none rounded-lg border border-gray-border text-orange placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1 disabled:border-gray-highlight disabled:text-gray-border relative pr-7">
          <span className="flex items-center">
            <span className="block truncate">{text}</span>
          </span>
          <IoIosArrowDown className="absolute inset-y-0 -right-1 flex items-center w-8 pr-2 mt-2.5 pointer-events-none opacity-50" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-20 w-full overflow-auto border border-t-0 text-gray-normal mt bg-gray-dark border-gray-border">
          {options.map((item, index) => {
            return (
              <Listbox.Option
                key={index}
                className={`relative px-2 py-1 cursor-default hover:bg-gray-border ${item === text && "text-white"
                  }`}
                value={item}
              >
                <div className="flex items-center">
                  <span className="block font-normal truncate">
                    {item}
                  </span>
                </div>
              </Listbox.Option>
            );
          })}
        </Listbox.Options>
      </Listbox>
    </div>
  )
}

export const InputWithLabel = ({
  label = "",
  placeholder = "",
  value = "",
  onChange = null,
  required = false,
  disabled = false
}) => {
  const [text, setText] = useState(value);

  useEffect(() => {
    onChange && onChange(text);
  }, [text])

  return (
    <div className="w-full">
      <div className="text-gray-label text-left">
        {label}
        {required && <span className="pl-1 text-white">*</span>}
      </div>
      <input
        className="outline-none rounded-lg text-orange border border-gray-blue disabled:border-gray-border disabled:text-gray-normal placeholder:text-gray-border px-2.5 bg-light-black w-full h-8 mt-1"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  )
}