import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";

interface MapPopupProps {
  setCoordinates: (coords: LatLngLiteral) => void;
}

const MapPopup: React.FC<MapPopupProps> = ({ setCoordinates }) => {
  const [position, setPosition] = useState<LatLngLiteral | null>(null);

  const MapClick: React.FC = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        setCoordinates(e.latlng);
      },
    });
    return position === null ? null : <Marker position={position} />;
  };

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClick />
    </MapContainer>
  );
};

export default MapPopup;