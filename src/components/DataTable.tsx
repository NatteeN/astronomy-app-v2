import React from "react";

type DataItem = {
  date: Date;
  object: string;
  rise?: Date | null;
  riseAngle?: number | null;
  set?: Date | null;
  setAngle?: number | null;
  phase?: number | null;
  highestTime?: Date | null;
  altitude?: number | string; // อาจเป็น string ถ้า format มาแล้ว
  constellation?: string;
};

interface DataTableProps {
  data: DataItem[];
  selectedObject: string;
  isDataDisplayed: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, selectedObject, isDataDisplayed }) => {
  const formatTime24 = (date?: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  };

  return (
    <table>
      <thead>
        <tr>
          <th rowSpan={2}>วันที่</th>
          <th rowSpan={2}>วัตถุ</th>
          <th colSpan={2}>ขึ้น</th>
          <th colSpan={2}>ตก</th>
          {isDataDisplayed && selectedObject === "ดวงจันทร์" && <th rowSpan={2}>ดิถี</th>}
          <th colSpan={3}>ตำแหน่งสูงสุดบนท้องฟ้า</th>
        </tr>
        <tr>
          <th>เวลา</th>
          <th>มุม</th>
          <th>เวลา</th>
          <th>มุม</th>
          <th>เวลา</th>
          <th>มุม</th>
          <th>อยู่ในกลุ่มดาว</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>
              {item.date.toLocaleDateString("th-TH")} (
              {item.date.toLocaleDateString("th-TH", { weekday: "short" })})
            </td>
            <td>{item.object}</td>
            <td>{item.rise ? formatTime24(item.rise) : "–"}</td>
            <td>{item.riseAngle !== undefined && item.riseAngle !== null ? item.riseAngle.toFixed(1) + `°` : "–"}</td>
            <td>{item.set ? formatTime24(item.set) : "–"}</td>
            <td>{item.setAngle !== undefined && item.setAngle !== null ? item.setAngle.toFixed(1) + `°` : "–"}</td>
            {isDataDisplayed && selectedObject === "ดวงจันทร์" && (
              <td>
                {item.phase !== null && item.phase !== undefined
                  ? (item.phase * 100).toFixed(0) + `%`
                  : "–"}
              </td>
            )}
            <td>{item.highestTime ? formatTime24(item.highestTime) : "–"}</td>
            <td>{item.altitude}°</td>
            <td>{item.constellation}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;