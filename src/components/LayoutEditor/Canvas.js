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

const Canvas = ({
  elements,
  selectedIds,
  onElementSelect,
  onElementUpdate,
}) => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null); // {x, y, width, height}
  const selectionStartRef = useRef(null);

  useEffect(() => {
    if (transformerRef.current && selectedIds && selectedIds.length > 0) {
      const stage = stageRef.current;
      const selectedNodes = selectedIds
        .map((id) => stage.findOne(`#${id}`))
        .filter(Boolean);
      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds, elements]);

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
    } else if (element.type === "hallway") {
      // 복도는 45도 단위로만 회전
      const newWidth = snapSizeToGrid(
        Math.min(MAX_SIZE, node.width() * scaleX)
      );
      const newHeight = snapSizeToGrid(
        Math.min(MAX_SIZE, node.height() * scaleY)
      );
      const newRotation = Math.round(node.rotation() / 45) * 45; // 45도 단위로 스냅
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

  // 드래그 셀렉션 시작
  const handleStageMouseDown = (e) => {
    // 요소 위가 아니라면 셀렉션 시작
    if (e.target === e.target.getStage()) {
      selectionStartRef.current = {
        x: e.evt.offsetX,
        y: e.evt.offsetY,
      };
      setSelectionRect({
        x: e.evt.offsetX,
        y: e.evt.offsetY,
        width: 0,
        height: 0,
      });
      onElementSelect(null); // 선택 해제
    }
  };

  // 드래그 셀렉션 중
  const handleStageMouseMove = (e) => {
    if (!selectionStartRef.current) return;
    const sx = selectionStartRef.current.x;
    const sy = selectionStartRef.current.y;
    const ex = e.evt.offsetX;
    const ey = e.evt.offsetY;
    setSelectionRect({
      x: Math.min(sx, ex),
      y: Math.min(sy, ey),
      width: Math.abs(ex - sx),
      height: Math.abs(ey - sy),
    });
  };

  // 드래그 셀렉션 종료
  const handleStageMouseUp = (e) => {
    if (!selectionRect) return;
    // 셀렉션 영역과 겹치는 요소 id 모두 선택
    const selected = elements
      .filter((el) => {
        const ex = el.x;
        const ey = el.y;
        const ew = el.width || (el.type === "text" ? 60 : 40);
        const eh = el.height || (el.type === "text" ? 24 : 40);
        return (
          ex < selectionRect.x + selectionRect.width &&
          ex + ew > selectionRect.x &&
          ey < selectionRect.y + selectionRect.height &&
          ey + eh > selectionRect.y
        );
      })
      .map((el) => el.id);
    if (selected.length > 0) {
      onElementSelect(selected, true); // 다중 선택
    }
    setSelectionRect(null);
    selectionStartRef.current = null;
  };

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={800}
        height={600}
        className="canvas-stage"
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          {/* 드래그 셀렉션 박스 */}
          {selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="#3b82f6"
              opacity={0.15}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 2]}
              listening={false}
            />
          )}
          {/* 격자 배경 */}
          {renderGrid()}

          {/* 공간 먼저 */}
          {spaces.map((el) => {
            const isSelected = selectedIds.includes(el.id);
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
                onClick={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                onTap={(e) => onElementSelect(el.id, e.evt.shiftKey)}
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
            const isSelected = selectedIds.includes(el.id);
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
                  onClick={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                  onTap={(e) => onElementSelect(el.id, e.evt.shiftKey)}
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
                    onClick={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                    onTap={(e) => onElementSelect(el.id, e.evt.shiftKey)}
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
                    fontFamily="Pretendard, system-ui, sans-serif"
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
                  fontFamily="Pretendard, system-ui, sans-serif"
                  fill={isSelected ? "#3b82f6" : el.fill || "#374151"}
                  fontWeight={isSelected ? "600" : "500"}
                  draggable
                  onClick={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                  onTap={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                  onMouseEnter={() => setHoveredId(el.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onDragMove={(e) => handleDragMove(e, el)}
                  onDragEnd={(e) => handleDragEnd(e, el)}
                  onTransformEnd={(e) => handleTransformEnd(e, el)}
                />
              );
            } else if (el.type === "hallway") {
              const style = getElementStyle(el, isSelected, isHovered);
              const hallwayWidth = el.width;
              const hallwayHeight = el.height;
              const rotation = el.rotation || 0;

              return (
                <Group key={el.id}>
                  {/* 복도 배경 */}
                  <Rect
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={hallwayWidth}
                    height={hallwayHeight}
                    rotation={rotation}
                    fill={style.fill || "#f8fafc"}
                    stroke={style.stroke || "#475569"}
                    strokeWidth={style.strokeWidth || 2}
                    shadowColor={style.shadowColor}
                    shadowBlur={style.shadowBlur}
                    shadowOpacity={style.shadowOpacity}
                    shadowOffset={style.shadowOffset}
                    cornerRadius={6}
                    draggable
                    onClick={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                    onTap={(e) => onElementSelect(el.id, e.evt.shiftKey)}
                    onMouseEnter={() => setHoveredId(el.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onDragMove={(e) => handleDragMove(e, el)}
                    onDragEnd={(e) => handleDragEnd(e, el)}
                    onTransformEnd={(e) => handleTransformEnd(e, el)}
                  />

                  {/* 복도 중앙선 패턴 */}
                  <Group x={el.x} y={el.y} rotation={rotation}>
                    {/* 중앙선 */}
                    <Line
                      points={[
                        hallwayWidth / 2,
                        0,
                        hallwayWidth / 2,
                        hallwayHeight,
                      ]}
                      stroke="#64748b"
                      strokeWidth={2}
                      dash={[8, 4]}
                      listening={false}
                    />

                    {/* 복도 양쪽 경계선 */}
                    <Line
                      points={[4, 0, 4, hallwayHeight]}
                      stroke="#94a3b8"
                      strokeWidth={1}
                      dash={[4, 4]}
                      listening={false}
                    />
                    <Line
                      points={[
                        hallwayWidth - 4,
                        0,
                        hallwayWidth - 4,
                        hallwayHeight,
                      ]}
                      stroke="#94a3b8"
                      strokeWidth={1}
                      dash={[4, 4]}
                      listening={false}
                    />

                    {/* 복도 방향 화살표 (중앙에 여러 개 배치) */}
                    {hallwayHeight > 40 && (
                      <>
                        {/* 첫 번째 화살표 */}
                        <Group
                          x={hallwayWidth / 2 - 8}
                          y={hallwayHeight * 0.25}
                        >
                          <Line
                            points={[0, 0, 12, 0]}
                            stroke="#475569"
                            strokeWidth={2}
                            listening={false}
                          />
                          <Line
                            points={[12, 0, 8, -4]}
                            stroke="#475569"
                            strokeWidth={2}
                            listening={false}
                          />
                          <Line
                            points={[12, 0, 8, 4]}
                            stroke="#475569"
                            strokeWidth={2}
                            listening={false}
                          />
                        </Group>

                        {/* 두 번째 화살표 */}
                        <Group
                          x={hallwayWidth / 2 - 8}
                          y={hallwayHeight * 0.75}
                        >
                          <Line
                            points={[0, 0, 12, 0]}
                            stroke="#475569"
                            strokeWidth={2}
                            listening={false}
                          />
                          <Line
                            points={[12, 0, 8, -4]}
                            stroke="#475569"
                            strokeWidth={2}
                            listening={false}
                          />
                          <Line
                            points={[12, 0, 8, 4]}
                            stroke="#475569"
                            strokeWidth={2}
                            listening={false}
                          />
                        </Group>
                      </>
                    )}

                    {/* 복도 양쪽 끝 표시 (문 형태) */}
                    <Rect
                      x={0}
                      y={0}
                      width={6}
                      height={hallwayHeight}
                      fill="#e2e8f0"
                      stroke="#64748b"
                      strokeWidth={1}
                      cornerRadius={2}
                      listening={false}
                    />
                    <Rect
                      x={hallwayWidth - 6}
                      y={0}
                      width={6}
                      height={hallwayHeight}
                      fill="#e2e8f0"
                      stroke="#64748b"
                      strokeWidth={1}
                      cornerRadius={2}
                      listening={false}
                    />
                  </Group>

                  {/* 복도 라벨 제거됨 */}
                </Group>
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
