import { useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';

// tables: array of { id, label, capacity, posX, posY, width, height, area }
// mode: "edit" (owner, draggable) | "view" (customer, read-only + selectable)
export default function TableCanvas({
  tables,
  mode = 'view',
  availableTableIds = [],
  selectedTableId = null,
  onSelectTable,
  onPositionChange,
}) {
  const [draftPositions, setDraftPositions] = useState({});
  const width = 900; // widened — tables were getting clipped at the old 640px edge
  const height = 480;

  function fill(table) {
    if (mode === 'edit') return '#F4F1EA';
    if (selectedTableId === table.id) return '#ff654d';
    if (availableTableIds.includes(table.id)) return '#ffffff';
    return '#e7e3d9';
  }
  function stroke(table) {
    if (selectedTableId === table.id) return '#ff654d';
    return '#d8d2c8';
  }
  function clickable(table) {
    return mode === 'view' && availableTableIds.includes(table.id);
  }

  // Keeps a table's drag position fully inside the stage — this is what fixes
  // tables visually "disappearing"/getting cut off at the canvas edge: instead
  // of letting a table be dragged (or loaded at) a position outside the visible
  // area where Konva just clips it, we clamp it to stay on-canvas.
  function clampPosition(x, y, tableWidth, tableHeight) {
    const clampedX = Math.max(0, Math.min(x, width - tableWidth));
    const clampedY = Math.max(0, Math.min(y, height - tableHeight));
    return { x: clampedX, y: clampedY };
  }

  return (
    <div className="canvas-wrap">
      <Stage width={width} height={height}>
        <Layer>
          {tables.map((table) => {
            const tableWidth = table.width || 60;
            const tableHeight = table.height || 60;
            const rawPos = draftPositions[table.id] || { x: table.posX, y: table.posY };
            const pos = clampPosition(rawPos.x, rawPos.y, tableWidth, tableHeight);
            const unavailable = mode === 'view' && !availableTableIds.includes(table.id);

            return (
              <Group
                key={table.id}
                x={pos.x}
                y={pos.y}
                draggable={mode === 'edit'}
                dragBoundFunc={(pagePos) => {
                  // Konva calls this with the Stage's absolute pixel position during
                  // drag — clamp it live so the table can never be dragged off-canvas.
                  const stageBox = { x: 0, y: 0, width, height };
                  const x = Math.max(stageBox.x, Math.min(pagePos.x, stageBox.x + width - tableWidth));
                  const y = Math.max(stageBox.y, Math.min(pagePos.y, stageBox.y + height - tableHeight));
                  return { x, y };
                }}
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  const clamped = clampPosition(x, y, tableWidth, tableHeight);
                  setDraftPositions((prev) => ({ ...prev, [table.id]: clamped }));
                  onPositionChange?.(table.id, { posX: clamped.x, posY: clamped.y });
                }}
                onClick={() => clickable(table) && onSelectTable?.(table.id)}
                onTap={() => clickable(table) && onSelectTable?.(table.id)}
                opacity={unavailable ? 0.5 : 1}
              >
                <Rect
                  width={tableWidth}
                  height={tableHeight}
                  fill={fill(table)}
                  stroke={stroke(table)}
                  strokeWidth={1.5}
                  cornerRadius={10}
                  shadowColor="black"
                  shadowOpacity={0.08}
                  shadowBlur={4}
                  shadowOffsetY={2}
                />
                <Text
                  text={table.label}
                  width={tableWidth}
                  height={tableHeight - 16}
                  align="center"
                  verticalAlign="middle"
                  fontSize={13}
                  fontFamily="DM Sans, sans-serif"
                  fontStyle="600"
                  fill={selectedTableId === table.id ? '#fff' : '#1d2723'}
                />
                <Text
                  text={`seats ${table.capacity}`}
                  width={tableWidth}
                  y={tableHeight - 16}
                  align="center"
                  fontSize={9}
                  fontFamily="DM Sans, sans-serif"
                  fill={selectedTableId === table.id ? '#ffffffcc' : '#6f7872'}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
