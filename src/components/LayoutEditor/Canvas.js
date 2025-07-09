import React, { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Transformer, Line } from "react-konva";

const GRID_SIZE = 20;
const MIN_SIZE = GRID_SIZE;
const MAX_SIZE = 600;

const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;
const snapSizeToGrid = (value) =>
  Math.max(GRID_SIZE, Math.round(value / GRID_SIZE) * GRID_SIZE);

const Canvas = ({ elements, selectedId, onElementSelect, onElementUpdate }) => {
  const stageRef = useRef();
  const transformerRef = useRef();

  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, elements]);

  const handleElementClick = (id) => {
    onElementSelect(id);
  };

  const handleDragMove = (e, element) => {
    // 드래그 중에도 격자에 스냅
    e.target.x(snapToGrid(e.target.x()));
    e.target.y(snapToGrid(e.target.y()));
  };

  const handleDragEnd = (e, element) => {
    const updatedElement = {
      ...element,
      x: snapToGrid(e.target.x()),
      y: snapToGrid(e.target.y()),
    };
    onElementUpdate(updatedElement);
  };

  const handleTransformEnd = (e, element) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    if (element.type === "space") {
      // 공간은 더 큰 최대값 허용, 격자 단위로 스냅
      const newWidth = snapSizeToGrid(Math.min(2000, node.width() * scaleX));
      const newHeight = snapSizeToGrid(Math.min(2000, node.height() * scaleY));
      const updatedElement = {
        ...element,
        x: snapToGrid(node.x()),
        y: snapToGrid(node.y()),
        width: newWidth,
        height: newHeight,
      };
      onElementUpdate(updatedElement);
    } else if (element.type === "text") {
      let newFontSize = snapSizeToGrid(
        Math.min(MAX_SIZE, (element.fontSize || 18) * scaleY)
      );
      const updatedElement = {
        ...element,
        x: snapToGrid(node.x()),
        y: snapToGrid(node.y()),
        fontSize: newFontSize,
      };
      onElementUpdate(updatedElement);
    } else {
      // room/door 등은 기존대로, 격자 단위로 스냅
      const newWidth = snapSizeToGrid(
        Math.min(MAX_SIZE, node.width() * scaleX)
      );
      const newHeight = snapSizeToGrid(
        Math.min(MAX_SIZE, node.height() * scaleY)
      );
      const updatedElement = {
        ...element,
        x: snapToGrid(node.x()),
        y: snapToGrid(node.y()),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      };
      onElementUpdate(updatedElement);
    }
  };

  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i <= 800; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`v${i}`}
          points={[i, 0, i, 600]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }
    for (let i = 0; i <= 600; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, i, 800, i]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }
    return lines;
  };

  if (!elements) return null;

  // 공간 먼저, 나머지 나중에 렌더링
  const spaces = elements.filter((el) => el.type === "space");
  const others = elements.filter((el) => el.type !== "space");

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Stage
        ref={stageRef}
        width={800}
        height={600}
        style={{ border: "1px solid #ccc", backgroundColor: "#f5f5f5" }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onElementSelect(null);
        }}
      >
        <Layer>
          {/* 격자 배경 */}
          {renderGrid()}

          {/* 공간 먼저 */}
          {spaces.map((el) => (
            <Rect
              key={el.id}
              id={el.id}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={el.style?.fill || "#f0f0f0"}
              stroke={
                selectedId === el.id ? "#ff5252" : el.style?.stroke || "#1976d2"
              }
              strokeWidth={el.style?.strokeWidth || 2}
              draggable
              onClick={() => handleElementClick(el.id)}
              onTap={() => handleElementClick(el.id)}
              onDragMove={(e) => handleDragMove(e, el)}
              onDragEnd={(e) => handleDragEnd(e, el)}
              onTransformEnd={(e) => handleTransformEnd(e, el)}
            />
          ))}
          {/* 나머지 요소(방, 문, 텍스트 등) */}
          {others.map((el) => {
            if (el.type === "door") {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill={el.style?.fill || "#ffe082"}
                  stroke={
                    selectedId === el.id
                      ? "#ff5252"
                      : el.style?.stroke || "#bfa600"
                  }
                  strokeWidth={el.style?.strokeWidth || 2}
                  draggable
                  onClick={() => handleElementClick(el.id)}
                  onTap={() => handleElementClick(el.id)}
                  onDragMove={(e) => handleDragMove(e, el)}
                  onDragEnd={(e) => handleDragEnd(e, el)}
                  onTransformEnd={(e) => handleTransformEnd(e, el)}
                />
              );
            } else if (el.type === "room") {
              return (
                <React.Fragment key={el.id}>
                  <Rect
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rotation={el.rotation}
                    fill={el.style?.fill || "#e3f2fd"}
                    stroke={
                      selectedId === el.id
                        ? "#ff5252"
                        : el.style?.stroke || "#1976d2"
                    }
                    strokeWidth={el.style?.strokeWidth || 2}
                    draggable
                    onClick={() => handleElementClick(el.id)}
                    onTap={() => handleElementClick(el.id)}
                    onDragMove={(e) => handleDragMove(e, el)}
                    onDragEnd={(e) => handleDragEnd(e, el)}
                    onTransformEnd={(e) => handleTransformEnd(e, el)}
                  />
                  <Text
                    x={el.x}
                    y={el.y + el.height / 2 - 10}
                    width={el.width}
                    align="center"
                    text={
                      el.properties?.roomNumber || el.properties?.roomName || ""
                    }
                    fontSize={16}
                    fill="#333"
                    listening={false}
                  />
                </React.Fragment>
              );
            } else if (el.type === "text") {
              return (
                <Text
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={el.fontSize || 18}
                  fill={selectedId === el.id ? "#ff5252" : el.fill || "#333"}
                  draggable
                  onClick={() => handleElementClick(el.id)}
                  onTap={() => handleElementClick(el.id)}
                  onDragMove={(e) => handleDragMove(e, el)}
                  onDragEnd={(e) => handleDragEnd(e, el)}
                  onTransformEnd={(e) => handleTransformEnd(e, el)}
                />
              );
            }
            return null;
          })}

          {/* 선택된 요소 Transformer */}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
