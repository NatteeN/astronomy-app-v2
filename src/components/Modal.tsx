import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import type { LatLngTuple, LeafletMouseEvent } from "leaflet";
import "./Modal.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Map } from "leaflet";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
  currentPosition?: { lat: number; lng: number } | null;  // เพิ่ม props นี้
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, setCoordinates, currentPosition }) => {
  const mapRef = useRef<Map>(null);
  const [markerPosition, setMarkerPosition] = useState<LatLngTuple | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngTuple | null>(null);

  // ใช้ useEffect อัพเดตตำแหน่ง marker + center เมื่อ currentPosition เปลี่ยน
  useEffect(() => {
    if (currentPosition) {
      const { lat, lng } = currentPosition;
      setMarkerPosition([lat, lng]);
      setMapCenter([lat, lng]);
      setCoordinates({ lat, lng });
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 12);
      }
    }
  }, [currentPosition]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับ Geolocation");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkerPosition([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setCoordinates({ lat: latitude, lng: longitude });
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
      },
      (error) => {
        alert("ไม่สามารถขอพิกัดปัจจุบันได้: " + error.message);
      }
    );
  };

  // const handleMapClick = (event: LeafletMouseEvent) => {
  //   const { lat, lng } = event.latlng;
  //   setMarkerPosition([lat, lng]);
  //   setMapCenter([lat, lng]);
  //   console.log({ lat, lng });
  //   setCoordinates({ lat, lng });
  // };

  useEffect(() => {
    if (isOpen && mapRef.current) {
      // รอให้ DOM ปรับขนาดแล้วเรียก invalidateSize
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 0);
    }
  }, [isOpen]);

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-button" onClick={onClose} title="ปิดหน้าต่าง">
            ✕
          </button>

          {/* ปุ่มเข็มทิศ */}
          <button className="current-location-button"
            title="ตำแหน่งปัจจุบัน"
            onClick={handleGetCurrentLocation}
          >
            <i className="fa-solid fa-location-crosshairs black-icon"></i>
          </button>

          <MapContainer
            ref={mapRef}
            center={mapCenter ?? [13.5, 100.5]} // ถ้า null จะใช้ค่าดีฟอลต์
            zoom={16}
            className="map-container"
            // เอา whenReady ออก เพราะ callback ไม่มีพารามิเตอร์และไม่ต้องทำอะไรที่นี่
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
            {markerPosition && <Marker key={markerPosition.toString()} position={markerPosition} />}
            <MapClickHandler onMapClick={(e) => {
              setMarkerPosition([e.latlng.lat, e.latlng.lng]);
              setMapCenter([e.latlng.lat, e.latlng.lng]);
              setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
            }} />
          </MapContainer>
        </div>
      </div>
    )
  );
};

interface MapClickHandlerProps {
  onMapClick: (event: LeafletMouseEvent) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
};

export const getCityName = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const address = response.data.address;
    const city = address.city || address.town || address.village || "Unknown location";
    return city;
  } catch (error) {
    console.error("Error fetching city name:", error);
    return "Error retrieving location";
  }
};

export default Modal;