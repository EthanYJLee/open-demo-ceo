import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Canvas from "../components/LayoutEditor/Canvas";
import Toolbar from "../components/LayoutEditor/Toolbar";
import PropertiesPanel from "../components/LayoutEditor/PropertiesPanel";
import { layoutTemplates } from "../templates/layoutTemplates";

function uuid() {
  return Math.random().toString(36).substr(2, 9);
}

const DEFAULT_SPACE = () => ({
  id: uuid(),
  type: "space",
  x: 80,
  y: 80,
  width: 400,
  height: 250,
  name: "공간",
  spaceType: "room", // room, corridor, restroom 등
  style: { fill: "#f0f0f0", stroke: "#1976d2", strokeWidth: 2 },
});

const DEFAULT_ROOM = (parentId = null) => ({
  id: uuid(),
  type: "room",
  x: 120,
  y: 120,
  width: 40,
  height: 40,
  rotation: 0,
  parent: parentId, // 포함된 공간 id
  properties: {
    roomNumber: "",
    roomName: "방",
    capacity: 1,
    pricePerHour: 10000,
  },
  style: {
    fill: "#e3f2fd",
    stroke: "#1976d2",
    strokeWidth: 2,
  },
});

const DEFAULT_DOOR = (parentId = null) => ({
  id: uuid(),
  type: "door",
  x: 100,
  y: 80,
  width: 20,
  height: 40,
  parent: parentId,
  direction: "right", // left/right/top/bottom
  style: { fill: "#ffe082", stroke: "#bfa600", strokeWidth: 2 },
});

const DEFAULT_TEXT = () => ({
  id: uuid(),
  type: "text",
  x: 120,
  y: 120,
  text: "텍스트",
  fontSize: 18,
  fill: "#333",
});

const LayoutEditor = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();

  // 템플릿 선택 상태
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    layoutTemplates[0].id
  );
  // elements: [{id, type, ...}]
  const [elements, setElements] = useState(
    layoutTemplates[0].elements.map((e) => ({ ...e, id: uuid() }))
  );
  const [selectedId, setSelectedId] = useState(null);
  const [showProperties, setShowProperties] = useState(false);
  const [loading, setLoading] = useState(false);

  // 템플릿 변경 핸들러
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = layoutTemplates.find((t) => t.id === templateId);
    setElements(template.elements.map((e) => ({ ...e, id: uuid() })));
    setSelectedId(null);
    setShowProperties(false);
  };

  // 요소 추가 핸들러
  const handleAddElement = (type) => {
    if (type === "space") {
      setElements((prev) => [...prev, DEFAULT_SPACE()]);
    } else if (type === "room") {
      setElements((prev) => [...prev, DEFAULT_ROOM()]);
    } else if (type === "door") {
      setElements((prev) => [...prev, DEFAULT_DOOR()]);
    } else if (type === "text") {
      setElements((prev) => [...prev, DEFAULT_TEXT()]);
    }
  };

  // 요소 선택 핸들러
  const handleElementSelect = (id) => {
    setSelectedId(id);
    setShowProperties(true);
  };

  // 요소 속성 변경 핸들러 (색상/폰트 등 스타일은 제한)
  const handleElementUpdate = (updatedElement) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === updatedElement.id
          ? {
              ...el,
              ...updatedElement,
              // 스타일 커스터마이즈 제한: 색상/폰트 등은 템플릿 값 고정
              style: el.style,
              fill: el.fill,
            }
          : el
      )
    );
  };

  // 삭제 핸들러
  const handleDeleteSelected = () => {
    if (selectedId) {
      setElements((prev) => prev.filter((el) => el.id !== selectedId));
      setSelectedId(null);
      setShowProperties(false);
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/branches")}
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">⬅️</span>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                레이아웃 편집
              </h1>
              <p className="text-sm text-gray-600">공간 배치도를 편집하세요</p>
            </div>
          </div>
          {/* 템플릿 선택 드롭다운 */}
          <div className="flex items-center space-x-2">
            <label
              htmlFor="template-select"
              className="text-sm text-gray-700 font-medium"
            >
              레이아웃 템플릿
            </label>
            <select
              id="template-select"
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {layoutTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-row items-start min-h-[600px]">
        {/* 툴바 */}
        <div className="w-16 bg-gray-50 border-r h-full">
          <Toolbar
            onAddElement={handleAddElement}
            onDeleteSelected={handleDeleteSelected}
            selectedId={selectedId}
          />
        </div>

        {/* 캔버스 */}
        <div className="flex-1 bg-gray-100 p-4 h-full flex items-start">
          <Canvas
            elements={elements}
            selectedId={selectedId}
            onElementSelect={handleElementSelect}
            onElementUpdate={handleElementUpdate}
          />
        </div>

        {/* 속성 패널 공간: 항상 w-80 차지 */}
        <div className="w-80 bg-white border-l h-full">
          {showProperties && selectedElement ? (
            <PropertiesPanel
              element={selectedElement}
              onUpdate={handleElementUpdate}
              onClose={() => setShowProperties(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LayoutEditor;
