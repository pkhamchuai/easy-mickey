"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const PALETTES = [
  {
    name: "สีพื้นฐาน",
    colors: [
      { color: "#171720", label: "ดำ" },
      { color: "#FFFFFF", label: "ขาว" },
      { color: "#6B7280", label: "เทา" },
      { color: "#EF476F", label: "ชมพู" },
      { color: "#EF4444", label: "แดง" },
      { color: "#F59E0B", label: "ส้ม" },
      { color: "#FACC15", label: "เหลือง" },
      { color: "#22C55E", label: "เขียว" },
      { color: "#3B82F6", label: "น้ำเงิน" },
      { color: "#8B5CF6", label: "ม่วง" },
    ],
  },
  {
    name: "สีผิว · แสง–เงา",
    colors: [
      { color: "#FFF1E6", label: "ไฮไลต์ผิว" },
      { color: "#F6D2BA", label: "ผิวสว่าง" },
      { color: "#E8B18B", label: "ผิวโทนกลางสว่าง" },
      { color: "#CB8A62", label: "ผิวโทนกลาง" },
      { color: "#A96340", label: "ผิวแทน" },
      { color: "#7A432E", label: "ผิวเข้ม" },
      { color: "#4A2A22", label: "เงาผิวเข้ม" },
      { color: "#2B1815", label: "เงาลึก" },
      { color: "#E89A8B", label: "สีแก้ม" },
    ],
  },
  {
    name: "ต้นไม้ · สว่าง–มืด",
    colors: [
      { color: "#D8F28A", label: "ใบไม้โดนแสง" },
      { color: "#A6D85D", label: "เขียวอ่อน" },
      { color: "#65B84E", label: "เขียวใบไม้" },
      { color: "#347A3D", label: "เขียวกลาง" },
      { color: "#1E5134", label: "เขียวเงา" },
      { color: "#102F25", label: "เขียวมืด" },
      { color: "#A87548", label: "เปลือกไม้สว่าง" },
      { color: "#5B3A29", label: "เปลือกไม้มืด" },
    ],
  },
  {
    name: "ท้องฟ้า · น้ำ",
    colors: [
      { color: "#D8F3FF", label: "ขอบฟ้าสว่าง" },
      { color: "#83CCF4", label: "ฟ้ากลางวัน" },
      { color: "#3D91D8", label: "ฟ้ากลางวันเข้ม" },
      { color: "#7765A8", label: "ฟ้ายามโพล้เพล้" },
      { color: "#243A6B", label: "ฟ้ากลางคืน" },
      { color: "#0C1835", label: "ฟ้ากลางคืนมืด" },
      { color: "#B8F3EE", label: "ประกายน้ำ" },
      { color: "#40E0D0", label: "Turquoise" },
      { color: "#26A9B8", label: "น้ำทะเล" },
      { color: "#126B7A", label: "น้ำลึก" },
      { color: "#12344D", label: "น้ำมืด" },
    ],
  },
  {
    name: "ดวงอาทิตย์ · Golden hour",
    colors: [
      { color: "#FFF7C2", label: "แสงอาทิตย์นวล" },
      { color: "#FFE066", label: "ดวงอาทิตย์สีทอง" },
      { color: "#FFBE55", label: "แสงทองอุ่น" },
      { color: "#FFD2B8", label: "ฟ้าอาทิตย์ขึ้น" },
      { color: "#F7A1B5", label: "ชมพูอาทิตย์ขึ้น" },
      { color: "#FF8A3D", label: "ส้มอาทิตย์ตก" },
      { color: "#F45B69", label: "แดงปะการังอาทิตย์ตก" },
      { color: "#DC568D", label: "ชมพูยามเย็น" },
      { color: "#B35C96", label: "Golden hour ติดม่วง" },
      { color: "#7B4F9D", label: "ม่วงยามสนธยา" },
      { color: "#4C3B72", label: "ม่วงหลังอาทิตย์ตก" },
    ],
  },
  {
    name: "48 Group",
    colors: [
      { color: "#4CDFE8", label: "CGM48" },
      { color: "#C894C0", label: "BNK48" },
    ],
  },
];

const COLORS = PALETTES.flatMap((palette) => palette.colors);

const HISTORY_LIMIT = 8;
const MAX_LAYERS = 8;

type Point = { x: number; y: number };
type DrawingLayer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  thumbnail?: string;
};
export type CanvasMode = "normal" | "ge2026";

const CANVAS_MODES = {
  normal: { width: 1200, height: 1200, label: "Normal Mode" },
  ge2026: { width: 1200, height: 1694, label: "GE 2026 Mode" },
} as const;

export function DrawingBoard({ mode }: { mode: CanvasMode }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const historyRef = useRef(new Map<string, ImageData[]>());
  const historyOrderRef = useRef<string[]>([]);
  const redoHistoryRef = useRef(new Map<string, ImageData[]>());
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  const templatePromiseRef = useRef<Promise<HTMLImageElement> | null>(null);
  const drawingRef = useRef(false);
  const drawingLayerIdRef = useRef<string | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const nextLayerIdRef = useRef(2);
  const [layers, setLayers] = useState<DrawingLayer[]>([
    { id: "layer-1", name: "Layer 1", visible: true, locked: false, opacity: 100 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState("layer-1");
  const [historyAvailability, setHistoryAvailability] = useState({ undo: false, redo: false });
  const [color, setColor] = useState(PALETTES[0].colors[0].color);
  const [brushSize, setBrushSize] = useState(12);
  const [opacity, setOpacity] = useState(100);
  const [erasing, setErasing] = useState(false);
  const [status, setStatus] = useState(`${CANVAS_MODES[mode].label} พร้อมใช้งาน`);
  const canvasConfig = CANVAS_MODES[mode];
  const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];
  const canUndo = historyAvailability.undo;
  const canRedo = historyAvailability.redo;

  const loadTemplateImage = useCallback(() => {
    if (templateImageRef.current) {
      return Promise.resolve(templateImageRef.current);
    }
    if (templatePromiseRef.current) return templatePromiseRef.current;

    templatePromiseRef.current = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        templateImageRef.current = image;
        resolve(image);
      };
      image.onerror = () => reject(new Error("โหลด GE template ไม่สำเร็จ"));
      image.src = "/GE_template.png";
    });
    return templatePromiseRef.current;
  }, []);

  useEffect(() => {
    if (mode !== "ge2026") return;
    void loadTemplateImage().catch(() => {
      templatePromiseRef.current = null;
    });
  }, [loadTemplateImage, mode]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const preventBrowserGesture = (event: Event) => event.preventDefault();
    const nonPassive: AddEventListenerOptions = { passive: false };

    surface.addEventListener("touchstart", preventBrowserGesture, nonPassive);
    surface.addEventListener("touchmove", preventBrowserGesture, nonPassive);
    surface.addEventListener("selectstart", preventBrowserGesture);
    surface.addEventListener("dragstart", preventBrowserGesture);
    surface.addEventListener("contextmenu", preventBrowserGesture);

    return () => {
      surface.removeEventListener("touchstart", preventBrowserGesture, nonPassive);
      surface.removeEventListener("touchmove", preventBrowserGesture, nonPassive);
      surface.removeEventListener("selectstart", preventBrowserGesture);
      surface.removeEventListener("dragstart", preventBrowserGesture);
      surface.removeEventListener("contextmenu", preventBrowserGesture);
    };
  }, []);

  const updateLayerThumbnail = useCallback((layerId: string) => {
    const canvas = canvasRefs.current.get(layerId);
    if (!canvas) return;
    const preview = document.createElement("canvas");
    preview.width = 72;
    preview.height = Math.round((72 * canvas.height) / canvas.width);
    preview.getContext("2d")?.drawImage(canvas, 0, 0, preview.width, preview.height);
    const thumbnail = preview.toDataURL("image/png");
    setLayers((current) => current.map((layer) =>
      layer.id === layerId ? { ...layer, thumbnail } : layer
    ));
  }, []);

  function getPoint(event: ReactPointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * canvasConfig.width) / bounds.width,
      y: ((event.clientY - bounds.top) * canvasConfig.height) / bounds.height,
    };
  }

  function applyBrush(context: CanvasRenderingContext2D) {
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brushSize;
    context.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    context.strokeStyle = color;
    context.fillStyle = color;
    context.globalAlpha = erasing ? 1 : opacity / 100;
  }

  function refreshHistoryAvailability(layerId: string) {
    setHistoryAvailability({
      undo: (historyRef.current.get(layerId)?.length ?? 0) > 0,
      redo: (redoHistoryRef.current.get(layerId)?.length ?? 0) > 0,
    });
  }

  function saveState(layerId = activeLayerId) {
    const canvas = canvasRefs.current.get(layerId);
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const history = historyRef.current.get(layerId) ?? [];
    history.push(context.getImageData(0, 0, canvas.width, canvas.height));
    historyRef.current.set(layerId, history);
    historyOrderRef.current.push(layerId);
    while (historyOrderRef.current.length > HISTORY_LIMIT) {
      const oldestLayerId = historyOrderRef.current.shift();
      if (!oldestLayerId) break;
      const oldestHistory = historyRef.current.get(oldestLayerId) ?? [];
      oldestHistory.shift();
      historyRef.current.set(oldestLayerId, oldestHistory);
    }
    redoHistoryRef.current.clear();
    refreshHistoryAvailability(layerId);
  }

  function startDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (!activeLayer.visible) {
      setStatus("กรุณาเปิด Layer ก่อนวาด");
      return;
    }
    if (activeLayer.locked) {
      setStatus("Layer นี้ถูกล็อกอยู่");
      return;
    }

    const canvas = canvasRefs.current.get(activeLayerId);
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    event.preventDefault();
    saveState();
    drawingRef.current = true;
    drawingLayerIdRef.current = activeLayerId;
    const point = getPoint(event);
    lastPointRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);

    applyBrush(context);
    context.beginPath();
    context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
    setStatus(erasing ? "กำลังลบ…" : "กำลังวาด…");
  }

  function draw(event: ReactPointerEvent<HTMLDivElement>) {
    const layerId = drawingLayerIdRef.current;
    const canvas = layerId ? canvasRefs.current.get(layerId) : undefined;
    const context = canvas?.getContext("2d");
    const lastPoint = lastPointRef.current;
    if (!drawingRef.current || !canvas || !context || !lastPoint) return;

    event.preventDefault();
    const point = getPoint(event);
    applyBrush(context);
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  }

  function stopDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drawingRef.current) return;

    const layerId = drawingLayerIdRef.current;
    drawingRef.current = false;
    drawingLayerIdRef.current = null;
    lastPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (layerId) updateLayerThumbnail(layerId);
    setStatus(erasing ? "ยางลบพร้อมใช้งาน" : "พู่กันพร้อมใช้งาน");
  }

  const undo = useCallback(() => {
    const canvas = canvasRefs.current.get(activeLayerId);
    const context = canvas?.getContext("2d");
    const history = historyRef.current.get(activeLayerId) ?? [];
    const previous = history.pop();
    if (!canvas || !context || !previous) return;

    const redoHistory = redoHistoryRef.current.get(activeLayerId) ?? [];
    redoHistory.push(context.getImageData(0, 0, canvas.width, canvas.height));
    if (redoHistory.length > HISTORY_LIMIT) redoHistory.shift();
    redoHistoryRef.current.set(activeLayerId, redoHistory);
    historyRef.current.set(activeLayerId, history);
    const orderIndex = historyOrderRef.current.lastIndexOf(activeLayerId);
    if (orderIndex >= 0) historyOrderRef.current.splice(orderIndex, 1);
    context.putImageData(previous, 0, 0);
    updateLayerThumbnail(activeLayerId);
    refreshHistoryAvailability(activeLayerId);
    setStatus("ย้อนกลับแล้ว");
  }, [activeLayerId, updateLayerThumbnail]);

  const redo = useCallback(() => {
    const canvas = canvasRefs.current.get(activeLayerId);
    const context = canvas?.getContext("2d");
    const redoHistory = redoHistoryRef.current.get(activeLayerId) ?? [];
    const next = redoHistory.pop();
    if (!canvas || !context || !next) return;

    const history = historyRef.current.get(activeLayerId) ?? [];
    history.push(context.getImageData(0, 0, canvas.width, canvas.height));
    historyRef.current.set(activeLayerId, history);
    historyOrderRef.current.push(activeLayerId);
    redoHistoryRef.current.set(activeLayerId, redoHistory);
    context.putImageData(next, 0, 0);
    updateLayerThumbnail(activeLayerId);
    refreshHistoryAvailability(activeLayerId);
    setStatus("ทำซ้ำแล้ว");
  }, [activeLayerId, updateLayerThumbnail]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (command && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  function chooseColor(nextColor: string) {
    setColor(nextColor);
    setErasing(false);
    setStatus("พู่กันพร้อมใช้งาน");
  }

  function selectLayer(layerId: string) {
    setActiveLayerId(layerId);
    refreshHistoryAvailability(layerId);
    setStatus("เลือก Layer แล้ว");
  }

  function addLayer() {
    if (layers.length >= MAX_LAYERS) {
      setStatus(`เพิ่มได้สูงสุด ${MAX_LAYERS} Layers`);
      return;
    }
    const number = nextLayerIdRef.current++;
    const layer: DrawingLayer = {
      id: `layer-${number}`,
      name: `Layer ${number}`,
      visible: true,
      locked: false,
      opacity: 100,
    };
    setLayers((current) => [...current, layer]);
    setActiveLayerId(layer.id);
    setHistoryAvailability({ undo: false, redo: false });
    setStatus("เพิ่ม Layer แล้ว");
  }

  function duplicateLayer() {
    if (layers.length >= MAX_LAYERS) {
      setStatus(`เพิ่มได้สูงสุด ${MAX_LAYERS} Layers`);
      return;
    }
    const source = canvasRefs.current.get(activeLayerId);
    if (!source) return;

    const number = nextLayerIdRef.current++;
    const duplicate: DrawingLayer = {
      ...activeLayer,
      id: `layer-${number}`,
      name: `${activeLayer.name} copy`,
      locked: false,
    };
    const sourceIndex = layers.findIndex((layer) => layer.id === activeLayerId);
    setLayers((current) => [
      ...current.slice(0, sourceIndex + 1),
      duplicate,
      ...current.slice(sourceIndex + 1),
    ]);
    setActiveLayerId(duplicate.id);
    setHistoryAvailability({ undo: false, redo: false });

    let attempts = 0;
    const copyPixels = () => {
      const destination = canvasRefs.current.get(duplicate.id);
      if (!destination && attempts++ < 3) {
        requestAnimationFrame(copyPixels);
        return;
      }
      destination?.getContext("2d")?.drawImage(source, 0, 0);
      updateLayerThumbnail(duplicate.id);
    };
    requestAnimationFrame(copyPixels);
    setStatus("Duplicate Layer แล้ว");
  }

  function deleteLayer() {
    if (layers.length === 1) {
      setStatus("ต้องเหลือ Layer วาดอย่างน้อย 1 Layer");
      return;
    }
    if (activeLayer.locked) {
      setStatus("ปลดล็อก Layer ก่อนลบ");
      return;
    }
    const index = layers.findIndex((layer) => layer.id === activeLayerId);
    const nextActive = layers[index - 1] ?? layers[index + 1];
    setLayers((current) => current.filter((layer) => layer.id !== activeLayerId));
    historyRef.current.delete(activeLayerId);
    historyOrderRef.current = historyOrderRef.current.filter((layerId) => layerId !== activeLayerId);
    redoHistoryRef.current.delete(activeLayerId);
    setActiveLayerId(nextActive.id);
    refreshHistoryAvailability(nextActive.id);
    setStatus("ลบ Layer แล้ว");
  }

  function updateLayer(layerId: string, values: Partial<DrawingLayer>) {
    setLayers((current) => current.map((layer) =>
      layer.id === layerId ? { ...layer, ...values } : layer
    ));
  }

  function moveLayer(layerId: string, direction: "up" | "down") {
    const index = layers.findIndex((layer) => layer.id === layerId);
    const target = direction === "up" ? index + 1 : index - 1;
    if (index < 0 || target < 0 || target >= layers.length) return;
    setLayers((current) => {
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
    setStatus("เรียง Layer แล้ว");
  }

  function mergeDown() {
    const index = layers.findIndex((layer) => layer.id === activeLayerId);
    if (index <= 0) {
      setStatus("ไม่มี Layer ด้านล่างให้รวม");
      return;
    }
    const below = layers[index - 1];
    if (activeLayer.locked || below.locked) {
      setStatus("ปลดล็อกทั้งสอง Layer ก่อนรวม");
      return;
    }
    const sourceCanvas = canvasRefs.current.get(activeLayerId);
    const belowCanvas = canvasRefs.current.get(below.id);
    const belowContext = belowCanvas?.getContext("2d");
    if (!sourceCanvas || !belowCanvas || !belowContext) return;

    saveState(below.id);
    const merged = document.createElement("canvas");
    merged.width = canvasConfig.width;
    merged.height = canvasConfig.height;
    const mergedContext = merged.getContext("2d");
    if (!mergedContext) return;
    if (below.visible) {
      mergedContext.globalAlpha = below.opacity / 100;
      mergedContext.drawImage(belowCanvas, 0, 0);
    }
    if (activeLayer.visible) {
      mergedContext.globalAlpha = activeLayer.opacity / 100;
      mergedContext.drawImage(sourceCanvas, 0, 0);
    }
    belowContext.clearRect(0, 0, belowCanvas.width, belowCanvas.height);
    belowContext.globalAlpha = 1;
    belowContext.globalCompositeOperation = "source-over";
    belowContext.drawImage(merged, 0, 0);

    setLayers((current) => current
      .filter((layer) => layer.id !== activeLayerId)
      .map((layer) => layer.id === below.id
        ? { ...layer, visible: true, opacity: 100 }
        : layer));
    historyRef.current.delete(activeLayerId);
    historyOrderRef.current = historyOrderRef.current.filter((layerId) => layerId !== activeLayerId);
    redoHistoryRef.current.delete(activeLayerId);
    setActiveLayerId(below.id);
    refreshHistoryAvailability(below.id);
    updateLayerThumbnail(below.id);
    setStatus("รวม Layer ด้านล่างแล้ว");
  }

  function clearCanvas() {
    if (activeLayer.locked) {
      setStatus("ปลดล็อก Layer ก่อนล้าง");
      return;
    }
    const canvas = canvasRefs.current.get(activeLayerId);
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    saveState();
    context.clearRect(0, 0, canvas.width, canvas.height);
    updateLayerThumbnail(activeLayerId);
    setStatus("ล้าง Layer แล้ว");
  }

  async function downloadDrawing() {
    try {
      setStatus("กำลังเตรียมภาพ PNG…");
      const output = document.createElement("canvas");
      output.width = canvasConfig.width;
      output.height = canvasConfig.height;
      const context = output.getContext("2d", { alpha: false });
      if (!context) return;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
      if (mode === "ge2026") {
        const template = await loadTemplateImage();
        context.drawImage(template, 0, 0, output.width, output.height);
      }
      for (const layer of layers) {
        if (!layer.visible) continue;
        const layerCanvas = canvasRefs.current.get(layer.id);
        if (!layerCanvas) continue;
        context.globalAlpha = layer.opacity / 100;
        context.drawImage(layerCanvas, 0, 0);
      }
      context.globalAlpha = 1;

      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `easy-mickey-${mode}-${timestamp}.png`;
      link.href = output.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus("บันทึกภาพ PNG แล้ว");
    } catch {
      templatePromiseRef.current = null;
      setStatus("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[#2a2a3d] bg-[#10101a] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="border-b border-[#2a2a3d] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
            พาเลตสี
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[#9896b0] transition hover:text-cyan-200">
            <span>สีเพิ่มเติม</span>
            <span className="relative h-9 w-9 overflow-hidden rounded-xl border border-[#3a3a50] bg-[#171724] p-1">
              <input
                type="color"
                value={color}
                onChange={(event) => chooseColor(event.target.value)}
                className="h-full w-full cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="เลือกสี">
          {COLORS.map((swatch) => (
            <button
              key={swatch.color}
              type="button"
              title={`${swatch.label} · ${swatch.color}`}
              aria-label={`${swatch.label} ${swatch.color}`}
              aria-pressed={!erasing && color.toUpperCase() === swatch.color.toUpperCase()}
              onClick={() => chooseColor(swatch.color)}
              className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
                !erasing && color.toUpperCase() === swatch.color.toUpperCase()
                  ? "border-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#10101a]"
                  : "border-white/15"
              }`}
              style={{ backgroundColor: swatch.color }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-5 border-b border-[#2a2a3d] p-4 sm:p-5">
        <label className="min-w-40 flex-1 lg:max-w-56">
          <span className="mb-1.5 flex justify-between text-xs font-medium text-[#9896b0]">
            <span>ขนาดพู่กัน</span>
            <output className="text-[#f0eff8]">{brushSize} px</output>
          </span>
          <input
            type="range"
            min="1"
            max="80"
            value={brushSize}
            onChange={(event) => setBrushSize(Number(event.target.value))}
            className="block w-full cursor-pointer accent-cyan-400"
          />
        </label>

        <label className="min-w-40 flex-1 lg:max-w-56">
          <span className="mb-1.5 flex justify-between text-xs font-medium text-[#9896b0]">
            <span>Opacity</span>
            <output className="text-[#f0eff8]">{opacity}%</output>
          </span>
          <input
            type="range"
            min="5"
            max="100"
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            className="block w-full cursor-pointer accent-cyan-400"
          />
        </label>

        <div className="flex w-full flex-wrap gap-2 xl:ml-auto xl:w-auto">
          <button
            type="button"
            aria-pressed={erasing}
            onClick={() => {
              setErasing((value) => !value);
              setStatus(erasing ? "พู่กันพร้อมใช้งาน" : "ยางลบพร้อมใช้งาน");
            }}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition xl:flex-none ${
              erasing
                ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                : "border-[#343449] bg-[#171724] text-[#c7c5d2] hover:border-cyan-500/40"
            }`}
          >
            ยางลบ
          </button>
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            className="flex-1 rounded-xl border border-[#343449] bg-[#171724] px-4 py-2.5 text-sm font-semibold text-[#c7c5d2] transition hover:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-35 xl:flex-none"
          >
            ย้อนกลับ
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            className="flex-1 rounded-xl border border-[#343449] bg-[#171724] px-4 py-2.5 text-sm font-semibold text-[#c7c5d2] transition hover:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-35 xl:flex-none"
          >
            ทำซ้ำ
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="flex-1 rounded-xl border border-[#343449] bg-[#171724] px-4 py-2.5 text-sm font-semibold text-[#c7c5d2] transition hover:border-pink-500/40 hover:text-pink-200 xl:flex-none"
          >
            ล้าง Layer
          </button>
          <button
            type="button"
            onClick={downloadDrawing}
            className="flex-1 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/70 hover:from-cyan-500/30 hover:to-teal-500/30 xl:flex-none"
          >
            บันทึก PNG
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[minmax(0,4fr)_minmax(200px,1fr)]">
        <div
          className="p-2.5 sm:p-4"
          style={{
            backgroundColor: "#151522",
            backgroundImage:
              "linear-gradient(45deg, #191929 25%, transparent 25%), linear-gradient(-45deg, #191929 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #191929 75%), linear-gradient(-45deg, transparent 75%, #191929 75%)",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
            backgroundSize: "16px 16px",
          }}
        >
          <div
            ref={surfaceRef}
            role="img"
            aria-label={mode === "normal" ? "พื้นที่วาดรูปสีขาว" : "พื้นที่วาดรูป GE 2026"}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className={`relative mx-auto block w-full max-w-[1200px] touch-none select-none overflow-hidden rounded-lg bg-white bg-[length:100%_100%] bg-center bg-no-repeat shadow-[0_12px_40px_rgba(0,0,0,0.35)] [-webkit-touch-callout:none] [-webkit-user-select:none] ${
              activeLayer.locked || !activeLayer.visible ? "cursor-not-allowed" : "cursor-crosshair"
            }`}
            style={{
              aspectRatio: `${canvasConfig.width} / ${canvasConfig.height}`,
              backgroundImage: mode === "ge2026" ? 'url("/GE_template.png")' : undefined,
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {layers.map((layer) => (
              <canvas
                key={layer.id}
                ref={(node) => {
                  if (node) canvasRefs.current.set(layer.id, node);
                  else canvasRefs.current.delete(layer.id);
                }}
                width={canvasConfig.width}
                height={canvasConfig.height}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{
                  display: layer.visible ? "block" : "none",
                  opacity: layer.opacity / 100,
                }}
              />
            ))}
          </div>
        </div>

        <aside className="border-t border-[#2a2a3d] bg-[#0d0d16] p-3 md:border-l md:border-t-0 sm:p-4" aria-label="Layers">
          <div className="md:sticky md:top-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#f0eff8]">Layers</h2>
                <p className="text-[11px] text-[#77758a]">{layers.length}/{MAX_LAYERS} Layers</p>
              </div>
              <button
                type="button"
                onClick={addLayer}
                disabled={layers.length >= MAX_LAYERS}
                className="rounded-lg border border-cyan-500/35 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400/70 disabled:opacity-35"
              >
                + เพิ่ม
              </button>
            </div>

            <div className="space-y-2">
              {[...layers].reverse().map((layer) => {
                const layerIndex = layers.findIndex((item) => item.id === layer.id);
                const selected = layer.id === activeLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => selectLayer(layer.id)}
                    className={`rounded-xl border p-2 transition ${
                      selected
                        ? "border-cyan-400/60 bg-cyan-400/10"
                        : "border-[#2a2a3d] bg-[#151520] hover:border-[#414158]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-10 w-10 shrink-0 rounded-md border border-[#343449] bg-white bg-contain bg-center bg-no-repeat"
                        style={{
                          backgroundImage: layer.thumbnail ? `url(${layer.thumbnail})` : undefined,
                          opacity: layer.opacity / 100,
                        }}
                        aria-hidden="true"
                      />
                      <input
                        value={layer.name}
                        onFocus={() => selectLayer(layer.id)}
                        onChange={(event) => updateLayer(layer.id, { name: event.target.value })}
                        onClick={(event) => event.stopPropagation()}
                        aria-label="ชื่อ Layer"
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-[#e3e1eb] outline-none focus:text-cyan-200"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateLayer(layer.id, { visible: !layer.visible });
                        }}
                        className="rounded-md bg-[#20202d] py-1 text-xs text-[#aaa8bc] hover:text-cyan-200"
                        title={layer.visible ? "ซ่อน Layer" : "แสดง Layer"}
                        aria-label={layer.visible ? "ซ่อน Layer" : "แสดง Layer"}
                      >
                        {layer.visible ? "◉" : "○"}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateLayer(layer.id, { locked: !layer.locked });
                        }}
                        className="rounded-md bg-[#20202d] py-1 text-xs text-[#aaa8bc] hover:text-cyan-200"
                        title={layer.locked ? "ปลดล็อก Layer" : "ล็อก Layer"}
                        aria-label={layer.locked ? "ปลดล็อก Layer" : "ล็อก Layer"}
                      >
                        {layer.locked ? "▣" : "□"}
                      </button>
                      <button
                        type="button"
                        disabled={layerIndex === layers.length - 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveLayer(layer.id, "up");
                        }}
                        className="rounded-md bg-[#20202d] py-1 text-xs text-[#aaa8bc] hover:text-cyan-200 disabled:opacity-25"
                        title="เลื่อน Layer ขึ้น"
                        aria-label="เลื่อน Layer ขึ้น"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={layerIndex === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveLayer(layer.id, "down");
                        }}
                        className="rounded-md bg-[#20202d] py-1 text-xs text-[#aaa8bc] hover:text-cyan-200 disabled:opacity-25"
                        title="เลื่อน Layer ลง"
                        aria-label="เลื่อน Layer ลง"
                      >
                        ↓
                      </button>
                    </div>

                    {selected && (
                      <label className="mt-2 block" onClick={(event) => event.stopPropagation()}>
                        <span className="mb-1 flex justify-between text-[10px] text-[#77758a]">
                          <span>Layer opacity</span>
                          <output>{layer.opacity}%</output>
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={layer.opacity}
                          onChange={(event) => updateLayer(layer.id, { opacity: Number(event.target.value) })}
                          className="block w-full cursor-pointer accent-cyan-400"
                        />
                      </label>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center gap-2 rounded-xl border border-[#2a2a3d] bg-[#11111b] p-2 opacity-75">
                <span
                  className="h-10 w-10 shrink-0 rounded-md border border-[#343449] bg-white bg-cover bg-center"
                  style={{ backgroundImage: mode === "ge2026" ? 'url("/GE_template.png")' : undefined }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#aaa8bc]">
                    {mode === "ge2026" ? "GE Template" : "พื้นหลังสีขาว"}
                  </p>
                  <p className="text-[10px] text-[#666478]">Background · Locked</p>
                </div>
                <span className="text-xs text-[#77758a]" aria-label="ล็อก">▣</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={duplicateLayer}
                disabled={layers.length >= MAX_LAYERS}
                className="rounded-lg border border-[#343449] bg-[#171724] px-2 py-2 text-[11px] font-medium text-[#aaa8bc] transition hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-35"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={mergeDown}
                disabled={layers.findIndex((layer) => layer.id === activeLayerId) === 0}
                className="rounded-lg border border-[#343449] bg-[#171724] px-2 py-2 text-[11px] font-medium text-[#aaa8bc] transition hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-35"
              >
                Merge Down
              </button>
              <button
                type="button"
                onClick={deleteLayer}
                disabled={layers.length === 1 || activeLayer.locked}
                className="col-span-2 rounded-lg border border-pink-500/20 bg-pink-500/5 px-2 py-2 text-[11px] font-medium text-pink-300/80 transition hover:border-pink-500/50 disabled:opacity-35"
              >
                ลบ Layer
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#2a2a3d] px-4 py-3 text-xs text-[#77758a]">
        <p role="status">{status}</p>
        <p className="hidden sm:block">กด Ctrl/⌘ + Z เพื่อย้อนกลับ</p>
      </div>
    </section>
  );
}
