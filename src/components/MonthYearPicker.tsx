import React, { useState, useEffect, forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale/th";

interface MonthYearPickerProps {
  id?: string;
  setSelectedMonthYear: (value: { month: number; year: number }) => void;
}

registerLocale("th", th);

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ setSelectedMonthYear }) => {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);

  useEffect(() => {
    setSelectedMonthYear({
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    });
  }, []);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    setStartDate(date);
    setSelectedMonthYear({
      month: date.getMonth() + 1,
      year: date.getFullYear(), // ส่งปี ค.ศ.
    });
  };

  const formatThaiMonthYear = (date: Date) => {
    const monthName = thaiMonths[date.getMonth()];
    const thaiYear = date.getFullYear() + 543;
    return `${monthName} ${thaiYear}`;
  };

  // สร้าง custom input เพื่อบังคับให้แสดงเป็นไทย
  const CustomInput = forwardRef<HTMLInputElement, { value?: string; onClick?: () => void }>(
    ({ onClick }, ref) => (
      <input
        type="text"
        readOnly
        value={formatThaiMonthYear(startDate)}
        onClick={onClick}
        ref={ref}
        style={{
          width: "100%",
          padding: "8px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "1rem",
          background: "#fff",
          cursor: "pointer",
        }}
      />
    )
  );
  CustomInput.displayName = "CustomInput";

  return (
    <DatePicker
      selected={startDate}
      onChange={handleDateChange}
      showMonthYearPicker
      locale="th"
      placeholderText="เลือกเดือนและปี"
      renderCustomHeader={({ date, decreaseYear, increaseYear }) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            padding: "0rem 0rem 0rem 0rem",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          <button type="button" onClick={decreaseYear}>
            {"<"}
          </button>
          <span>{date.getFullYear() + 543}</span>
          <button type="button" onClick={increaseYear}>
            {">"}
          </button>
        </div>
      )}
      customInput={<CustomInput />}
    />
  );
};

export default MonthYearPicker;