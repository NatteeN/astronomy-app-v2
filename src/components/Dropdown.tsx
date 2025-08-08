import React from "react";

interface DropdownProps {
  options: string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  label: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, onChange, label }) => {
  return (
    <div>
      <label>{label}</label>
      <select onChange={onChange} defaultValue="">
        <option value="" disabled>
          กรุณาเลือกวัตถุ
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;