import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../services/supabase";

const PropertiesPanel = ({ element, onUpdate, onClose }) => {
  const [properties, setProperties] = useState({});
  const updateTimerRef = useRef(null);
  const skipNextUpdateRef = useRef(false);
  const { branchId } = useParams();
  const [spaces, setSpaces] = useState([]); // [{id, name}]

  // 방 유형 옵션
  const roomTypes = [
    { value: "prayer", label: "기도실" },
    { value: "lounge", label: "휴게실" },
    { value: "bathroom", label: "화장실" },
    { value: "storage", label: "창고" },
    { value: "other", label: "기타" },
  ];

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
        roomType: element.properties?.roomType || "prayer",
        capacity: element.properties?.capacity || 4,
        pricePerHour: element.properties?.pricePerHour || 20000,
        spaceId: element.properties?.spaceId || "",
        isAvailable: element.properties?.isAvailable ?? true,
        category:
          element.properties?.category &&
          element.properties?.category !== "room"
            ? element.properties?.category
            : "prayer",
        amenities: element.properties?.amenities || "",
        images: element.properties?.images || "",
        operatingHours: element.properties?.operatingHours || "",
        fill: element.style?.fill || "#e3f2fd",
        stroke: element.style?.stroke || "#1976d2",
        strokeWidth: element.style?.strokeWidth || 2,
        text: element.text || "",
        fontSize: element.fontSize || 18,
        textFill: element.fill || "#333",
      });
      // 초기 로딩으로 인한 업데이트는 스킵
      skipNextUpdateRef.current = true;
    }
  }, [element]);

  // 연결 가능한 공간 목록 로드 (있으면 드롭다운 제공, 실패하면 무시)
  useEffect(() => {
    let ignore = false;
    const loadSpaces = async () => {
      try {
        if (!branchId) return;
        const { data, error } = await supabase
          .from("spaces")
          .select("id,name")
          .eq("branch_id", branchId)
          .order("name", { ascending: true });
        if (!ignore && !error && Array.isArray(data)) {
          setSpaces(data);
        }
      } catch (_) {
        // ignore; fallback to manual input
      }
    };
    loadSpaces();
    return () => {
      ignore = true;
    };
  }, [branchId]);

  const handleChange = (field, value) => {
    console.log(field);
    console.log(value);
    setProperties((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 90도 회전 핸들러
  const handleRotate = () => {
    if (element?.type === "room") return; // 방 요소는 회전 금지
    const currentRotation = properties.rotation || 0;
    const newRotation = (currentRotation + 90) % 360;
    setProperties((prev) => ({
      ...prev,
      rotation: newRotation,
    }));
  };

  // 속성 자동 적용 (디바운스)
  useEffect(() => {
    if (!element) return;
    if (skipNextUpdateRef.current) {
      skipNextUpdateRef.current = false;
      return;
    }

    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      let updatedElement = { ...element };
      if (element.type === "room") {
        updatedElement = {
          ...element,
          x: parseInt(properties.x),
          y: parseInt(properties.y),
          width: parseInt(properties.width),
          height: parseInt(properties.height),
          rotation: 0, // 방 요소는 회전 미지원
          properties: {
            ...element.properties,
            roomNumber: properties.roomNumber,
            roomName: properties.roomName,
            roomType: properties.roomType,
            spaceId: properties.spaceId || "",
            capacity: parseInt(properties.capacity),
            pricePerHour: parseInt(properties.pricePerHour),
            isAvailable: !!properties.isAvailable,
            category: properties.category,
            amenities: properties.amenities,
            images: properties.images,
            operatingHours: properties.operatingHours,
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
          rotation: parseInt(properties.rotation),
          text: properties.text,
          fontSize: parseInt(properties.fontSize),
          fill: properties.textFill,
        };
      } else {
        // 기타 요소들 (door, hallway, space 등)
        updatedElement = {
          ...element,
          x: parseInt(properties.x),
          y: parseInt(properties.y),
          width: parseInt(properties.width),
          height: parseInt(properties.height),
          rotation: parseInt(properties.rotation),
        };
      }
      onUpdate(updatedElement);
    }, 300); // 300ms 디바운스

    return () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, [properties, element, onUpdate]);

  if (!element) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {element.type === "room"
            ? "방 속성"
            : element.type === "text"
            ? "텍스트 속성"
            : "요소 속성"}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <span className="text-xl">✕</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 위치 및 크기 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            위치 및 크기
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">X</label>
              <input
                type="number"
                value={properties.x}
                onChange={(e) => handleChange("x", e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y</label>
              <input
                type="number"
                value={properties.y}
                onChange={(e) => handleChange("y", e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            {element.type === "room" && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    너비
                  </label>
                  <input
                    type="number"
                    value={properties.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    높이
                  </label>
                  <input
                    type="number"
                    value={properties.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </>
            )}
            {/* 회전: 방(room) 제외 요소에만 표시 */}
            {element.type !== "room" && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">회전</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={properties.rotation}
                    onChange={(e) => handleChange("rotation", e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    readOnly
                  />
                  <button
                    onClick={handleRotate}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="90도 회전"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 방 정보 */}
        {element.type === "room" && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">방 정보</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  방 번호
                </label>
                <input
                  type="text"
                  value={properties.roomNumber}
                  onChange={(e) => handleChange("roomNumber", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  방 이름
                </label>
                <input
                  type="text"
                  value={properties.roomName}
                  onChange={(e) => handleChange("roomName", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  공간 연결
                </label>
                {spaces && spaces.length > 0 ? (
                  <select
                    value={properties.spaceId}
                    onChange={(e) => handleChange("spaceId", e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="">선택 없음</option>
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="spaceId (직접 입력)"
                    value={properties.spaceId}
                    onChange={(e) => handleChange("spaceId", e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                )}
              </div>
              {/* 공간 연결/상태/카테고리 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  가용 여부
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!properties.isAvailable}
                    onChange={(e) =>
                      handleChange("isAvailable", e.target.checked)
                    }
                  />
                  예약 가능
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  카테고리
                </label>
                <select
                  value={properties.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="prayer">기도실</option>
                  <option value="lounge">휴게실</option>
                  <option value="bathroom">화장실</option>
                  <option value="storage">창고</option>
                  <option value="other">기타</option>
                </select>
              </div>
              {/* 편의시설/이미지/운영시간 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  편의시설 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="WiFi, Projector, Whiteboard"
                  value={properties.amenities}
                  onChange={(e) => handleChange("amenities", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  이미지 URL들 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  placeholder="https://.../img1.jpg, https://.../img2.jpg"
                  value={properties.images}
                  onChange={(e) => handleChange("images", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  운영 시간
                </label>
                <input
                  type="text"
                  placeholder="예: 09:00-18:00 (혹은 JSON)"
                  value={properties.operatingHours}
                  onChange={(e) =>
                    handleChange("operatingHours", e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              {/* 기도실일 때만 수용인원과 시간당 가격 표시 */}
              {properties.roomType === "prayer" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      수용 인원
                    </label>
                    <input
                      type="number"
                      value={properties.capacity}
                      onChange={(e) => handleChange("capacity", e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      시간당 가격
                    </label>
                    <input
                      type="number"
                      value={properties.pricePerHour}
                      onChange={(e) =>
                        handleChange("pricePerHour", e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* 텍스트 정보 */}
        {element.type === "text" && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              텍스트 정보
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  텍스트
                </label>
                <input
                  type="text"
                  value={properties.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  글자 크기
                </label>
                <input
                  type="number"
                  value={properties.fontSize}
                  onChange={(e) => handleChange("fontSize", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  글자 색상
                </label>
                <input
                  type="color"
                  value={properties.textFill}
                  onChange={(e) => handleChange("textFill", e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
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
                <label className="block text-xs text-gray-600 mb-1">
                  배경색
                </label>
                <input
                  type="color"
                  value={properties.fill}
                  onChange={(e) => handleChange("fill", e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  테두리색
                </label>
                <input
                  type="color"
                  value={properties.stroke}
                  onChange={(e) => handleChange("stroke", e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  테두리 두께
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={properties.strokeWidth}
                  onChange={(e) => handleChange("strokeWidth", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 저장 버튼 제거: 입력 변경 시 자동 적용 */}
    </div>
  );
};

export default PropertiesPanel;
