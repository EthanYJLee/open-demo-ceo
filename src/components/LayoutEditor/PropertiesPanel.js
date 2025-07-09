import React, { useState, useEffect } from "react";

const PropertiesPanel = ({ element, onUpdate, onClose }) => {
  const [properties, setProperties] = useState({});

  useEffect(() => {
    if (element) {
      setProperties({
        x: element.x || 0,
        y: element.y || 0,
        width: element.width || 100,
        height: element.height || 100,
        rotation: element.rotation || 0,
        roomNumber: element.properties?.roomNumber || "",
        roomName: element.properties?.roomName || "",
        capacity: element.properties?.capacity || 4,
        pricePerHour: element.properties?.pricePerHour || 20000,
        fill: element.style?.fill || "#e3f2fd",
        stroke: element.style?.stroke || "#1976d2",
        strokeWidth: element.style?.strokeWidth || 2,
        text: element.text || "",
        fontSize: element.fontSize || 18,
        textFill: element.fill || "#333",
      });
    }
  }, [element]);

  const handleChange = (field, value) => {
    setProperties((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    let updatedElement = { ...element };
    if (element.type === "room") {
      updatedElement = {
        ...element,
        x: parseInt(properties.x),
        y: parseInt(properties.y),
        width: parseInt(properties.width),
        height: parseInt(properties.height),
        rotation: parseInt(properties.rotation),
        properties: {
          ...element.properties,
          roomNumber: properties.roomNumber,
          roomName: properties.roomName,
          capacity: parseInt(properties.capacity),
          pricePerHour: parseInt(properties.pricePerHour),
        },
        style: {
          fill: properties.fill,
          stroke: properties.stroke,
          strokeWidth: parseInt(properties.strokeWidth),
        },
      };
    } else if (element.type === "text") {
      updatedElement = {
        ...element,
        x: parseInt(properties.x),
        y: parseInt(properties.y),
        text: properties.text,
        fontSize: parseInt(properties.fontSize),
        fill: properties.textFill,
      };
    }
    onUpdate(updatedElement);
  };

  if (!element) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {element.type === "room" ? "방 속성" : element.type === "text" ? "텍스트 속성" : "요소 속성"}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <span className="text-xl">✕</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 위치 및 크기 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">위치 및 크기</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">X</label>
              <input type="number" value={properties.x} onChange={e => handleChange("x", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y</label>
              <input type="number" value={properties.y} onChange={e => handleChange("y", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            {element.type === "room" && <>
              <div>
                <label className="block text-xs text-gray-600 mb-1">너비</label>
                <input type="number" value={properties.width} onChange={e => handleChange("width", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">높이</label>
                <input type="number" value={properties.height} onChange={e => handleChange("height", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">회전</label>
                <input type="number" value={properties.rotation} onChange={e => handleChange("rotation", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
            </>}
          </div>
        </div>
        {/* 방 정보 */}
        {element.type === "room" && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">방 정보</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">방 번호</label>
                <input type="text" value={properties.roomNumber} onChange={e => handleChange("roomNumber", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">방 이름</label>
                <input type="text" value={properties.roomName} onChange={e => handleChange("roomName", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">수용 인원</label>
                <input type="number" value={properties.capacity} onChange={e => handleChange("capacity", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">시간당 가격</label>
                <input type="number" value={properties.pricePerHour} onChange={e => handleChange("pricePerHour", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
            </div>
          </div>
        )}
        {/* 텍스트 정보 */}
        {element.type === "text" && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">텍스트 정보</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">텍스트</label>
                <input type="text" value={properties.text} onChange={e => handleChange("text", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">글자 크기</label>
                <input type="number" value={properties.fontSize} onChange={e => handleChange("fontSize", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">글자 색상</label>
                <input type="color" value={properties.textFill} onChange={e => handleChange("textFill", e.target.value)} className="w-full h-8 border border-gray-300 rounded" />
              </div>
            </div>
          </div>
        )}
        {/* 스타일 */}
        {element.type === "room" && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">스타일</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">배경색</label>
                <input type="color" value={properties.fill} onChange={e => handleChange("fill", e.target.value)} className="w-full h-8 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">테두리색</label>
                <input type="color" value={properties.stroke} onChange={e => handleChange("stroke", e.target.value)} className="w-full h-8 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">테두리 두께</label>
                <input type="number" min="0" max="10" value={properties.strokeWidth} onChange={e => handleChange("strokeWidth", e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <button onClick={handleSave} className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md font-medium">
          저장
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
