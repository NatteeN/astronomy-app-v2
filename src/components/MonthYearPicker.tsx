import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface MonthYearPickerProps {
  setSelectedMonthYear: (value: { month: number; year: number }) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ setSelectedMonthYear }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);

  const handleDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date) {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      setSelectedMonthYear({ month, year });
    }
  };

  return (
    <DatePicker
      selected={startDate}
      onChange={handleDateChange}
      showMonthYearPicker
      dateFormat="MM-yyyy"
      placeholderText="เลือกเดือนและปี"
    />
  );
};

export default MonthYearPicker;