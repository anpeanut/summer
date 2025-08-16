import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L, { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Layer } from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { CountryData } from '../types'; // 修正导入路径


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
  const geoJsonRef = useRef<LeafletGeoJSON>(null);
  const defaultPosition: [number, number] = [20, 0];
  const defaultZoom = 2;

  // 定义高亮样式
  const defaultStyle = {
    weight: 0,
    fillColor: '#2e9ae7ff',
    fillOpacity: 0.5,
  };

  const hoverStyle = {
    fillColor: '#e07f11ff', // 橙红色
    fillOpacity: 0.5,
  };

  // 为每个 GeoJSON feature 添加交互事件
  const onEachFeature = (feature: any, layer: Layer) => {
    // 绑定 Tooltip
    if (feature.properties && feature.properties.name) {
      layer.bindTooltip(feature.properties.name, {
        sticky: true, // Tooltip 会跟随鼠标
      });
    }

    layer.on({
      mouseover: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle(hoverStyle);
        targetLayer.bringToFront(); // 将高亮层置于顶层
      },
      mouseout: (e) => {
        const targetLayer = e.target;
        // 使用 geoJsonRef 来重置样式，确保样式一致性
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(targetLayer);
        }
      },
    });
  };

  // 当 data prop (及其 geoJson) 变化时，自动缩放地图以适应国家边界
  useEffect(() => {
    if (mapRef.current && geoJsonRef.current) {
      const bounds = geoJsonRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.flyToBounds(bounds);
      }
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
        attribution='&copy; <a href="https://www.carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {data?.geoJson && (
        <GeoJSON
          ref={geoJsonRef}
          key={data.id} // 使用唯一的 key 来强制重新渲染
          data={data.geoJson}
          style={defaultStyle}
          onEachFeature={onEachFeature}
        />
      )}
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
