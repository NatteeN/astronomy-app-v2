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
import "jspdf-autotable";
import "./App.css";
import axios from "axios";
import { Helmet } from "react-helmet";
import '@fortawesome/fontawesome-free/css/all.min.css';

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
  const [initialPosition, setInitialPosition] = useState<Coordinates | null>(null);
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
  const [activeTab, setActiveTab] = useState<"overview" | "monthly" | "about">("overview");

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
    // ดึงตำแหน่งครั้งแรกเมื่อโหลดเว็บ
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoordinates(coords);
          setInitialPosition(coords); // เซ็ตตำแหน่งเริ่มต้นที่นี่
        },
        (err) => {
          console.warn("ไม่สามารถรับพิกัดได้:", err.message);
        }
      );
    }
  }, [initialPosition]);

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
    if (!coordinates || !selectedObject || !monthYear.month || !monthYear.year) {
      alert("กรุณาระบุข้อมูลให้ครบถ้วน");
      return;
    }

    const daysInMonth = new Date(monthYear.year, monthYear.month, 0).getDate();
    const celestialData: CelestialData[] = [];
    const observer = new Observer(coordinates.lat, coordinates.lng, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthYear.year, monthYear.month - 1, day);
      const astroTime = new AstroTime(date);

      let specificData: CelestialData = { date, object: selectedObject };

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
        if (riseDate) specificData.rise = riseDate.date;

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
          if (getHorizonRise) specificData.riseAngle = getHorizonRise.azimuth;
        }

        const setDate = SearchRiseSet(body, observer, -1, astroTime, 1, 0);
        if (setDate) specificData.set = setDate.date;

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
          if (getHorizonSet) specificData.setAngle = getHorizonSet.azimuth;
        }

        if (selectedObject === "ดวงจันทร์") {
          const moonFraction = Illumination(body, astroTime);
          if (moonFraction) specificData.phase = moonFraction.phase_fraction;
        }

        const highestTime = SearchHourAngle(body, observer, 0, astroTime, 1);
        if (highestTime) {
          specificData.highestTime = highestTime.time.date;
          specificData.altitude =
            Math.round(highestTime.hor.altitude * 100) / 100;

          const ra = highestTime.hor.ra;
          const dec = highestTime.hor.dec;
          const constellationInfo = Constellation(ra, dec);
          const getThaiConstellationName = (englishName: string) =>
            (constellations as Record<string, string>)[englishName] ||
            englishName;
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
        <title>รายละเอียดของวัตถุท้องฟ้ารายเดือน</title>
      </Helmet>

      {/* ส่วนเลือกตำแหน่ง */}
      <section className="location">
        <div className="location">
          <strong>ตำแหน่งที่ตั้งของคุณ: </strong>
          {cityName}
          {" "}
          <button className="location-button" onClick={() => setIsModalOpen(true)} title="เลือกตำแหน่ง">
            <i className="fa-solid fa-location-dot"></i>
          </button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            setCoordinates={setCoordinates}
            currentPosition={initialPosition}
          />
        </div>
      </section>

      {/* เส้นแบ่ง */}
      <hr className="section-divider" />

      {/* Tabs */}
      <div className="tabs">
        {["overview", "monthly", "about"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => {
              if (activeTab !== tab) {
                setActiveTab(tab as "overview" | "monthly" | "about");
              }
            }}
            style={{ cursor: activeTab === tab ? "default" : "pointer" }}
            // disabled={activeTab === tab} // ถ้าอยากให้ disabled ด้วยก็ใส่ได้ (จะเป็นสีจางลง)
          >
            {{
              overview: "ภาพรวม",
              monthly: "ข้อมูลเวลาขึ้นตกของวัตถุท้องฟ้ารายเดือน",
              about: "เกี่ยวกับเว็บ",
            }[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div>
          <h2>ภาพรวมวัตถุท้องฟ้าในแต่ละค่ำคืน (เร็ว ๆ นี้)</h2>
        </div>
      )}

      {activeTab === "monthly" && (
        <div className="content-in-tab" style={{ width: "85vw", margin: "0 auto" }}>
          <section
            className="dropdown"
            style={{
              display: "flex",
              alignItems: "center",  // แก้ตรงนี้ ให้ปุ่มกับ dropdown อยู่ระดับกลางแนวตั้ง
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="object-select"
                style={{ marginBottom: "0.3rem", fontWeight: "bold" }}
              >
                วัตถุท้องฟ้า
              </label>
              {/* <Dropdown
                id="object-select"
                options={objects}
                onChange={handleObjectChange}
                label=""
                value={selectedObject}
              /> */}
              <Dropdown
                options={objects}
                onChange={handleObjectChange}
                label=""
              />
            </div>

            <div
              style={{
                flex: "0 0 150px", // fix width
                display: "flex",
                flexDirection: "column",
              }}
            >
              <label
                htmlFor="month-year-picker"
                style={{ marginBottom: "0.3rem", fontWeight: "bold" }}
              >
                เดือนปี
              </label>
              {/* <MonthYearPicker
                id="month-year-picker"
                setSelectedMonthYear={setMonthYear}
                selectedMonthYear={monthYear}
              /> */}
              <MonthYearPicker
                setSelectedMonthYear={setMonthYear}
              />
            </div>

            {/* ปุ่มแสดงข้อมูล */}
            <div>
              <button
                onClick={calculate}
                style={{ padding: "0.2rem 1rem", height: "2.2rem", margin: "1rem 0 0 1rem" /* กำหนดความสูงให้ปุ่มเท่ากับ dropdown */ }}
              >
                แสดงข้อมูล
              </button>
            </div>
          </section>

          {isDataDisplayed && selectedObject && (
            <>
              <h3>
                ตารางแสดงข้อมูลของ{selectedObject} เดือน{THmonth} ปี {displayYear}
              </h3>

              {data.length > 0 && (
                <>
                  <DataTable
                    data={data}
                    selectedObject={selectedObject}
                    isDataDisplayed={isDataDisplayed}
                  />

                  <button
                    onClick={() => window.print()}
                    style={{ marginTop: "1rem", marginBottom: "1rem", padding: "0.5rem 1rem", display: "block", margin: "1 auto" }}
                  >
                    พิมพ์หน้านี้
                  </button>
                </>
              )}
            </>
          )}

          {!isDataDisplayed && (
            <p style={{ marginBottom: "1rem", color: "#555", textAlign: "center" }}>
              กรุณาเลือกวัตถุท้องฟ้าและเดือนปีที่ต้องการทราบข้อมูลแล้วกด "แสดงข้อมูล" เพื่อดูข้อมูลรายเดือนของวัตถุท้องฟ้า
            </p>
          )}
        </div>
      )}

      {activeTab === "about" && (
        <div>
          <h2>เกี่ยวกับเว็บ (เร็ว ๆ นี้)</h2>
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default App;