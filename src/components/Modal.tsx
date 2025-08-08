import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import type { LatLngTuple, LeafletMouseEvent } from "leaflet";
import "./Modal.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Map } from "leaflet";
import axios from "axios";

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
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, setCoordinates }) => {
  const [markerPosition, setMarkerPosition] = useState<LatLngTuple>([13.5, 100.5]);
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([13.5, 100.5]);
  const mapRef = useRef<Map>(null);

  const handleMapClick = (event: LeafletMouseEvent) => {
    const { lat, lng } = event.latlng;
    setMarkerPosition([lat, lng]);
    setMapCenter([lat, lng]);
    console.log({ lat, lng });
    setCoordinates({ lat, lng });
  };

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
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
          <MapContainer
            ref={mapRef}
            center={mapCenter}
            zoom={10}
            className="map-container"
            // เอา whenReady ออก เพราะ callback ไม่มีพารามิเตอร์และไม่ต้องทำอะไรที่นี่
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
            <Marker key={markerPosition.toString()} position={markerPosition} />
            <MapClickHandler onMapClick={handleMapClick} />
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