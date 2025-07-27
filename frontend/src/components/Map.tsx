import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { Map as LeafletMap } from 'leaflet'; // 导入 Map 类型
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { CountryData } from '../services/countryService';


// Leaflet 的一个已知问题，需要手动修复其默认图标的路径
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


type MapProps = {
  data: CountryData | null;
};

function Map({ data }: MapProps) {
  const mapRef = useRef<LeafletMap>(null);
  const defaultPosition: [number, number] = [20, 0];
  const defaultZoom = 2;

  // 当 data prop 变化时，平滑移动地图到新的坐标
  useEffect(() => {
    if (mapRef.current && data) {
      // 后端坐标格式为 [经度, 纬度]，Leaflet 需要 [纬度, 经度]，因此需要交换
      const latLng: [number, number] = [data.location.coordinates[1], data.location.coordinates[0]];
      mapRef.current.flyTo(latLng, 5);
    }
  }, [data]);

  // 确定地图标记的显示位置
  const displayPosition: [number, number] = data
    ? [data.location.coordinates[1], data.location.coordinates[0]]
    : defaultPosition;

  return (
    // ref 用于获取 MapContainer 的实例，以便直接调用 flyTo 等方法
    <MapContainer ref={mapRef} center={displayPosition} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data && (
        <Marker position={displayPosition}>
          <Popup>
            {data.name} - {data.capital}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default Map;
