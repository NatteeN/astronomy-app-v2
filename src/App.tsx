import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import Dropdown from "./components/Dropdown";
import DataTable from "./components/DataTable";
import MonthYearPicker from "./components/MonthYearPicker";
import Modal from "./components/Modal";
import BackToTop from "./components/BackToTop";
import {
  Observer,
  Body,
  SearchRiseSet,
  AstroTime,
  SearchHourAngle,
  Constellation,
  Illumination,
  Horizon,
  Equator
} from "astronomy-engine";
import constellations from "./components/constellation_TH.json";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import "./App.css";
import axios from "axios";
import { Helmet } from "react-helmet";

interface Coordinates {
  lat: number;
  lng: number;
}

interface MonthYear {
  month: number | "";
  year: number | "";
}

interface CelestialData {
  date: Date;
  object: string;
  rise?: Date;
  riseAngle?: number | null;
  set?: Date;
  setAngle?: number | null;
  phase?: number;
  highestTime?: Date;
  altitude?: number;
  constellation?: string;
  info?: string;
}

const App: React.FC = () => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [selectedObject, setSelectedObject] = useState<string>("");
  const [monthYear, setMonthYear] = useState<MonthYear>({ month: "", year: "" });
  const [data, setData] = useState<CelestialData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataDisplayed, setIsDataDisplayed] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<number | "">(monthYear.month);
  const [displayYear, setDisplayYear] = useState<number | "">(
    monthYear.year ? monthYear.year + 543 : ""
  );
  const [cityName, setCityName] = useState("กรุณาเลือกสถานที่");

  const objects = [
    "ดวงอาทิตย์",
    "ดวงจันทร์",
    "ดาวพุธ",
    "ดาวศุกร์",
    "ดาวอังคาร",
    "ดาวพฤหัสบดี",
    "ดาวเสาร์",
    "ดาวเนปจูน",
    "ดาวยูเรนัส"
  ];

  const handleObjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedObject(e.target.value);
    setIsDataDisplayed(false);
  };

  function convertToDMS(decimal: number, isLatitude: boolean): string {
    const degrees = Math.floor(Math.abs(decimal));
    const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
    const seconds = (
      (Math.abs(decimal) - degrees - minutes / 60) *
      3600
    ).toFixed(1);
    const direction =
      decimal >= 0 ? (isLatitude ? "N" : "E") : isLatitude ? "S" : "W";

    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }

  useEffect(() => {
    if (coordinates) {
      const fetchCityName = async () => {
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&format=json&addressdetails=1&accept-language=th`
          );
          const address = response.data.address;

          const latDMS = convertToDMS(coordinates.lat, true);
          const lngDMS = convertToDMS(coordinates.lng, false);

          let city;
          if (address.suburb) {
            city = `${address.suburb} (${latDMS}, ${lngDMS})`;
          } else if (address.city) {
            city = `${address.city} (${latDMS}, ${lngDMS})`;
          } else if (address.town) {
            city = `${address.town} (${latDMS}, ${lngDMS})`;
          } else if (address.village) {
            city = `${address.village} (${latDMS}, ${lngDMS})`;
          } else if (address.subdistrict) {
            city = `${address.subdistrict} (${latDMS}, ${lngDMS})`;
          } else if (address.province) {
            city = `${address.province} (${latDMS}, ${lngDMS})`;
          } else {
            city = `ไม่ทราบชื่อสถานที่ (${latDMS}, ${lngDMS})`;
          }

          setCityName(city);
        } catch (error) {
          console.error("Error fetching city name:", error);
          setCityName("ไม่พบสถานที่");
        }
      };
      fetchCityName();
    }
  }, [coordinates]);

  const calculate = () => {
    if (
      !coordinates ||
      !selectedObject ||
      !monthYear.month ||
      !monthYear.year
    ) {
      alert("กรุณาระบบข้อมูลให้ครบทุกอย่าง");
      return;
    }

    const daysInMonth = new Date(
      monthYear.year,
      monthYear.month,
      0
    ).getDate();
    const celestialData: CelestialData[] = [];
    const observer = new Observer(coordinates.lat, coordinates.lng, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthYear.year, monthYear.month - 1, day);
      const astroTime = new AstroTime(date);

      let specificData: CelestialData = {
        date: date,
        object: selectedObject
      };

      const bodyMap: Record<string, Body> = {
        "ดวงอาทิตย์": Body.Sun,
        "ดวงจันทร์": Body.Moon,
        "ดาวพุธ": Body.Mercury,
        "ดาวศุกร์": Body.Venus,
        "ดาวอังคาร": Body.Mars,
        "ดาวพฤหัสบดี": Body.Jupiter,
        "ดาวเสาร์": Body.Saturn,
        "ดาวยูเรนัส": Body.Uranus,
        "ดาวเนปจูน": Body.Neptune
      };

      const body = bodyMap[selectedObject];

      if (body) {
        const riseDate = SearchRiseSet(body, observer, 1, astroTime, 1, 0);
        if (riseDate) {
          specificData.rise = riseDate.date;
        }
        if (body === Body.Moon && (!riseDate || riseDate.date === null)) {
          specificData.riseAngle = null;
        } else if (riseDate) {
          const equatorRise = Equator(body, riseDate.date, observer, true, true);
          const getHorizonRise = Horizon(
            riseDate.date,
            observer,
            equatorRise.ra,
            equatorRise.dec,
            "jplhor"
          );

          if (getHorizonRise) {
            specificData.riseAngle = getHorizonRise.azimuth;
          }
        }

        const setDate = SearchRiseSet(body, observer, -1, astroTime, 1, 0);
        if (setDate) {
          specificData.set = setDate.date;
        }
        if (body === Body.Moon && (!setDate || setDate.date === null)) {
          specificData.setAngle = null;
        } else if (setDate) {
          const equatorSet = Equator(body, setDate.date, observer, true, true);
          const getHorizonSet = Horizon(
            setDate.date,
            observer,
            equatorSet.ra,
            equatorSet.dec,
            "jplhor"
          );

          if (getHorizonSet) {
            specificData.setAngle = getHorizonSet.azimuth;
          }
        }

        if (selectedObject === "ดวงจันทร์") {
          const moonFraction = Illumination(body, astroTime);
          if (moonFraction) {
            specificData.phase = moonFraction.phase_fraction;
          }
        }

        const highestTime = SearchHourAngle(body, observer, 0, astroTime, 1);
        if (highestTime) {
          specificData.highestTime = highestTime.time.date;
          specificData.altitude = Math.round(highestTime.hor.altitude * 100) / 100;

          const ra = highestTime.hor.ra;
          const dec = highestTime.hor.dec;
          const constellationInfo = Constellation(ra, dec);
          const getThaiConstellationName = (englishName: string) => {
            return (constellations as Record<string, string>)[englishName] || englishName;
          };
          specificData.constellation = getThaiConstellationName(
            constellationInfo.name
          );
        }
      } else {
        specificData.info = "Data not available for this object.";
      }

      celestialData.push(specificData);
    }

    setData(celestialData);
    setIsDataDisplayed(true);

    setDisplayMonth(monthYear.month);
    setDisplayYear(monthYear.year + 543);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Astronomy Data");
    XLSX.writeFile(workbook, "astronomy_data.xlsx");
  };

  const monthMap: Record<string, string> = {
    "1": "มกราคม",
    "2": "กุมภาพันธ์",
    "3": "มีนาคม",
    "4": "เมษายน",
    "5": "พฤษภาคม",
    "6": "มิถุนายน",
    "7": "กรกฎาคม",
    "8": "สิงหาคม",
    "9": "กันยายน",
    "10": "ตุลาคม",
    "11": "พฤศจิกายน",
    "12": "ธันวาคม"
  };

  const THmonth = displayMonth ? monthMap[String(displayMonth)] : "";

  return (
    <div>
      <Helmet>
        <title>ค้นหาเวลาขึ้นตกของวัตถุท้องฟ้า</title>
      </Helmet>
      <h2>ค้นหาเวลาขึ้นตกของวัตถุท้องฟ้า</h2>
      <section className="location">
        <div className="location">
          <button className="location-button" onClick={() => setIsModalOpen(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              width="24"
              height="24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2C8.686 2 6 5.372 6 9c0 4.418 6 11 6 11s6-6.582 6-11c0-3.628-2.686-7-6-7zm0 3a3 3 0 100 6 3 3 0 000-6z"
              />
            </svg>
          </button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            setCoordinates={setCoordinates}
          />{" "}
          {cityName}
        </div>
      </section>
      <label>เลือกวัตถุและเดือน-ปีที่ต้องการทราบข้อมูล</label>
      <section className="dropdown">
        <Dropdown options={objects} onChange={handleObjectChange} label="วัตถุท้องฟ้า" />
        <MonthYearPicker setSelectedMonthYear={setMonthYear} />
      </section>
      <button onClick={calculate}>แสดงข้อมูล</button>
      {isDataDisplayed && selectedObject && (
        <h3>
          ตารางแสดงข้อมูลของ{selectedObject} เดือน{THmonth} ปี {displayYear}
        </h3>
      )}
      {isDataDisplayed && data.length > 0 && (
        <DataTable
          data={data}
          selectedObject={selectedObject}
          isDataDisplayed={isDataDisplayed}
        />
      )}
      <button onClick={exportToExcel}>Export to Excel</button>
      <button onClick={() => window.print()}>พิมพ์</button>
      <BackToTop />
    </div>
  );
};

export default App;