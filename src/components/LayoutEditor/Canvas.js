import React, { useRef, useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Transformer,
  Line,
  Arc,
  Group,
  Circle,
} from "react-konva";
import "../../styles/Canvas.scss";

const GRID_SIZE = 20;
const MIN_SIZE = GRID_SIZE;
const MAX_SIZE = 600;

const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;
const snapSizeToGrid = (value) =>
  Math.max(GRID_SIZE, Math.round(value / GRID_SIZE) * GRID_SIZE);

const Canvas = ({ elements, selectedId, onElementSelect, onElementUpdate }) => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);

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
    } else if (element.type === "door") {
      // 문은 크기 조정과 회전 모두 격자 단위로 스냅
      const newWidth = snapSizeToGrid(
        Math.min(MAX_SIZE, (element.width || 40) * scaleX)
      );
      const newHeight = snapSizeToGrid(
        Math.min(MAX_SIZE, (element.height || 20) * scaleY)
      );
      const newRotation = Math.round(node.rotation() / 30) * 30; // 30도 단위로 스냅
      const updatedElement = {
        ...element,
        x: snapToGrid(node.x()),
        y: snapToGrid(node.y()),
        width: newWidth,
        height: newHeight,
        rotation: newRotation,
      };
      onElementUpdate(updatedElement);
    } else {
      // room 등은 기존대로, 격자 단위로 스냅
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
    const majorGridSize = GRID_SIZE * 5; // 5칸마다 굵은 선

    // 세로선
    for (let i = 0; i <= 800; i += GRID_SIZE) {
      const isMajor = i % majorGridSize === 0;
      lines.push(
        <Line
          key={`v${i}`}
          points={[i, 0, i, 600]}
          stroke={isMajor ? "#d1d5db" : "#f3f4f6"}
          strokeWidth={isMajor ? 1 : 0.5}
          opacity={isMajor ? 0.8 : 0.4}
        />
      );
    }

    // 가로선
    for (let i = 0; i <= 600; i += GRID_SIZE) {
      const isMajor = i % majorGridSize === 0;
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, i, 800, i]}
          stroke={isMajor ? "#d1d5db" : "#f3f4f6"}
          strokeWidth={isMajor ? 1 : 0.5}
          opacity={isMajor ? 0.8 : 0.4}
        />
      );
    }

    // 격자 점 (5칸마다)
    for (let x = 0; x <= 800; x += majorGridSize) {
      for (let y = 0; y <= 600; y += majorGridSize) {
        lines.push(
          <Circle
            key={`dot-${x}-${y}`}
            x={x}
            y={y}
            radius={1.5}
            fill="#9ca3af"
            opacity={0.6}
          />
        );
      }
    }

    return lines;
  };

  const getElementStyle = (element, isSelected, isHovered) => {
    const baseStyle = element.style || {};

    if (isSelected) {
      return {
        ...baseStyle,
        stroke: "#3b82f6",
        strokeWidth: 3,
        shadowColor: "#3b82f6",
        shadowBlur: 10,
        shadowOpacity: 0.3,
        shadowOffset: { x: 0, y: 0 },
      };
    }

    if (isHovered) {
      return {
        ...baseStyle,
        stroke: "#60a5fa",
        strokeWidth: 2.5,
        shadowColor: "#60a5fa",
        shadowBlur: 5,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 0 },
      };
    }

    return baseStyle;
  };

  if (!elements) return null;

  // 공간 먼저, 나머지 나중에 렌더링
  const spaces = elements.filter((el) => el.type === "space");
  const others = elements.filter((el) => el.type !== "space");

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={800}
        height={600}
        className="canvas-stage"
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onElementSelect(null);
        }}
      >
        <Layer>
          {/* 격자 배경 */}
          {renderGrid()}

          {/* 공간 먼저 */}
          {spaces.map((el) => {
            const isSelected = selectedId === el.id;
            const isHovered = hoveredId === el.id;
            const style = getElementStyle(el, isSelected, isHovered);

            return (
              <Rect
                key={el.id}
                id={el.id}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                fill={style.fill || "#f8fafc"}
                stroke={style.stroke || "#64748b"}
                strokeWidth={style.strokeWidth || 2}
                shadowColor={style.shadowColor}
                shadowBlur={style.shadowBlur}
                shadowOpacity={style.shadowOpacity}
                shadowOffset={style.shadowOffset}
                cornerRadius={8}
                draggable
                onClick={() => handleElementClick(el.id)}
                onTap={() => handleElementClick(el.id)}
                onMouseEnter={() => setHoveredId(el.id)}
                onMouseLeave={() => setHoveredId(null)}
                onDragMove={(e) => handleDragMove(e, el)}
                onDragEnd={(e) => handleDragEnd(e, el)}
                onTransformEnd={(e) => handleTransformEnd(e, el)}
              />
            );
          })}

          {/* 나머지 요소(방, 문, 텍스트 등) */}
          {others.map((el) => {
            const isSelected = selectedId === el.id;
            const isHovered = hoveredId === el.id;

            if (el.type === "door") {
              // 문의 기본 크기 설정 (실제 도면 비율)
              const doorWidth = el.width || 40;
              const doorHeight = el.height || 20;
              const doorThickness = 3;
              const rotation = el.rotation || 0;
              const style = getElementStyle(el, isSelected, isHovered);

              return (
                <Group
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  rotation={rotation}
                  draggable
                  onClick={() => handleElementClick(el.id)}
                  onTap={() => handleElementClick(el.id)}
                  onMouseEnter={() => setHoveredId(el.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onDragMove={(e) => handleDragMove(e, el)}
                  onDragEnd={(e) => handleDragEnd(e, el)}
                  onTransformEnd={(e) => handleTransformEnd(e, el)}
                >
                  {/* 문의 호(arc) - 실제 도면 스타일 */}
                  <Arc
                    x={0}
                    y={0}
                    innerRadius={0}
                    outerRadius={doorWidth / 2}
                    angle={90}
                    fill={style.fill || "#fef3c7"}
                    stroke={style.stroke || "#f59e0b"}
                    strokeWidth={doorThickness}
                    shadowColor={style.shadowColor}
                    shadowBlur={style.shadowBlur}
                    shadowOpacity={style.shadowOpacity}
                    shadowOffset={style.shadowOffset}
                  />
                  {/* 문의 방향 표시 (화살표) - 고정 위치 */}
                  <Line
                    points={[
                      doorWidth / 4,
                      doorHeight / 2,
                      doorWidth / 2,
                      doorHeight / 2,
                    ]}
                    stroke={style.stroke || "#f59e0b"}
                    strokeWidth={2}
                    listening={false}
                  />
                  <Line
                    points={[
                      doorWidth / 2,
                      doorHeight / 2,
                      doorWidth / 2 - 3,
                      doorHeight / 2 - 3,
                    ]}
                    stroke={style.stroke || "#f59e0b"}
                    strokeWidth={2}
                    listening={false}
                  />
                  <Line
                    points={[
                      doorWidth / 2,
                      doorHeight / 2,
                      doorWidth / 2 - 3,
                      doorHeight / 2 + 3,
                    ]}
                    stroke={style.stroke || "#f59e0b"}
                    strokeWidth={2}
                    listening={false}
                  />
                </Group>
              );
            } else if (el.type === "room") {
              const style = getElementStyle(el, isSelected, isHovered);

              return (
                <React.Fragment key={el.id}>
                  <Rect
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rotation={el.rotation}
                    fill={style.fill || "#dbeafe"}
                    stroke={style.stroke || "#2563eb"}
                    strokeWidth={style.strokeWidth || 2}
                    shadowColor={style.shadowColor}
                    shadowBlur={style.shadowBlur}
                    shadowOpacity={style.shadowOpacity}
                    shadowOffset={style.shadowOffset}
                    cornerRadius={6}
                    draggable
                    onClick={() => handleElementClick(el.id)}
                    onTap={() => handleElementClick(el.id)}
                    onMouseEnter={() => setHoveredId(el.id)}
                    onMouseLeave={() => setHoveredId(null)}
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
                    fontSize={14}
                    fontFamily="Inter, system-ui, sans-serif"
                    fill="#1e293b"
                    fontWeight="600"
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
                  fontSize={el.fontSize || 16}
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={isSelected ? "#3b82f6" : el.fill || "#374151"}
                  fontWeight={isSelected ? "600" : "500"}
                  draggable
                  onClick={() => handleElementClick(el.id)}
                  onTap={() => handleElementClick(el.id)}
                  onMouseEnter={() => setHoveredId(el.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onDragMove={(e) => handleDragMove(e, el)}
                  onDragEnd={(e) => handleDragEnd(e, el)}
                  onTransformEnd={(e) => handleTransformEnd(e, el)}
                />
              );
            }
            return null;
          })}

          {/* 선택된 요소 Transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // 최소 크기 제한
              if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            keepRatio={false}
            enabledAnchors={[
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
            anchorSize={8}
            anchorCornerRadius={4}
            anchorFill="#3b82f6"
            anchorStroke="#1d4ed8"
            anchorStrokeWidth={2}
            borderStroke="#3b82f6"
            borderStrokeWidth={2}
            borderDash={[5, 5]}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
