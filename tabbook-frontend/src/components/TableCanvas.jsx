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
  const width = 640;
  const height = 400;

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

  return (
    <div className="canvas-wrap">
      <Stage width={width} height={height}>
        <Layer>
          {tables.map((table) => {
            const pos = draftPositions[table.id] || { x: table.posX, y: table.posY };
            const unavailable = mode === 'view' && !availableTableIds.includes(table.id);
            return (
              <Group
                key={table.id}
                x={pos.x}
                y={pos.y}
                draggable={mode === 'edit'}
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  setDraftPositions((prev) => ({ ...prev, [table.id]: { x, y } }));
                  onPositionChange?.(table.id, { posX: x, posY: y });
                }}
                onClick={() => clickable(table) && onSelectTable?.(table.id)}
                onTap={() => clickable(table) && onSelectTable?.(table.id)}
                opacity={unavailable ? 0.5 : 1}
              >
                <Rect
                  width={table.width || 60}
                  height={table.height || 60}
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
                  width={table.width || 60}
                  height={(table.height || 60) - 16}
                  align="center"
                  verticalAlign="middle"
                  fontSize={13}
                  fontFamily="DM Sans, sans-serif"
                  fontStyle="600"
                  fill={selectedTableId === table.id ? '#fff' : '#1d2723'}
                />
                <Text
                  text={`seats ${table.capacity}`}
                  width={table.width || 60}
                  y={(table.height || 60) - 16}
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
