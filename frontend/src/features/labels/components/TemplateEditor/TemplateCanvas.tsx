import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { DndContext, type DragEndEvent, useDraggable } from '@dnd-kit/core';
import type { LabelElement, LabelLayout, LabelPrintData } from '../../types/label.types';
import { FIELD_LABELS } from '../../types/label.types';
import { LabelRenderer } from '../LabelRenderer';
import styles from './TemplateEditor.module.css';

const PX_PER_MM = 4;

interface DraggableCanvasElementProps {
  element: LabelElement;
  selected: boolean;
  scale: number;
  onSelect: () => void;
}

function DraggableCanvasElement({ element, selected, scale, onSelect }: DraggableCanvasElementProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: element.id });

  const style: React.CSSProperties = {
    left: element.x * PX_PER_MM * scale,
    top: element.y * PX_PER_MM * scale,
    width: (element.width ?? 20) * PX_PER_MM * scale,
    height: (element.height ?? (element.type === 'TEXT' ? 4 : 8)) * PX_PER_MM * scale,
    fontSize: element.fontSize ? `${element.fontSize * scale}pt` : undefined,
    fontWeight: element.fontWeight,
    textAlign: element.textAlign,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const label = element.field === 'custom'
    ? element.customText || 'Texto'
    : element.field
      ? FIELD_LABELS[element.field]
      : element.type;

  return (
    <div
      ref={setNodeRef}
      className={`${styles.canvasElement} ${selected ? styles.selected : ''} ${!element.visible ? styles.hiddenEl : ''}`}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      {...listeners}
      {...attributes}
    >
      {element.type === 'TEXT' && (
        <div className={styles.elementLabel}>{label}</div>
      )}
      {(element.type === 'BARCODE' || element.type === 'QR') && (
        <div className={styles.elementPlaceholder}>{element.type === 'QR' ? 'QR' : 'Barcode'}</div>
      )}
      {element.type === 'IMAGE' && (
        <div className={styles.elementPlaceholder}>Logo</div>
      )}
    </div>
  );
}

interface Props {
  layout: LabelLayout;
  widthMm: number;
  heightMm: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayoutChange: (layout: LabelLayout) => void;
  previewData: LabelPrintData;
  showLivePreview: boolean;
}

export function TemplateCanvas({
  layout,
  widthMm,
  heightMm,
  selectedId,
  onSelect,
  onLayoutChange,
  previewData,
  showLivePreview,
}: Props) {
  const [zoom, setZoom] = useState(1);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const id = String(active.id);
    const element = layout.elements.find((e) => e.id === id);
    if (!element || !delta) return;

    const dxMm = delta.x / (PX_PER_MM * zoom);
    const dyMm = delta.y / (PX_PER_MM * zoom);

    const updated = layout.elements.map((el) =>
      el.id === id
        ? {
            ...el,
            x: Math.max(0, Math.round((el.x + dxMm) * 2) / 2),
            y: Math.max(0, Math.round((el.y + dyMm) * 2) / 2),
          }
        : el,
    );

    onLayoutChange({ ...layout, elements: updated });
  }, [layout, onLayoutChange, zoom]);

  const canvasW = widthMm * PX_PER_MM * zoom;
  const canvasH = heightMm * PX_PER_MM * zoom;
  const canvasRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.width = `${canvasW}px`;
      canvasRef.current.style.height = `${canvasH}px`;
    }
  }, [canvasW, canvasH]);

  return (
    <div className={styles.canvasArea}>
      <div className={styles.canvasToolbar}>
        <div className={styles.zoomControls}>
          <span>Zoom</span>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</button>
        </div>
        <span className={styles.canvasMeta}>
          {widthMm} × {heightMm} mm — arrastrá los elementos para posicionarlos
        </span>
      </div>

      <div className={styles.canvasScroll}>
        <DndContext onDragEnd={handleDragEnd}>
          {showLivePreview ? (
            <LabelRenderer
              data={previewData}
              layout={layout}
              widthMm={widthMm}
              heightMm={heightMm}
              className={styles.canvas}
            />
          ) : (
            <div
              ref={canvasRef}
              className={clsx(styles.canvas, styles.canvasSized)}
              onClick={() => onSelect(null)}
            >
              {layout.elements.map((el) => (
                <DraggableCanvasElement
                  key={el.id}
                  element={el}
                  selected={selectedId === el.id}
                  scale={zoom}
                  onSelect={() => onSelect(el.id)}
                />
              ))}
            </div>
          )}
        </DndContext>
      </div>
    </div>
  );
}
