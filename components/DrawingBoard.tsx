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

const HISTORY_LIMIT = 12;

type Point = { x: number; y: number };
export type CanvasMode = "normal" | "ge2026";

const CANVAS_MODES = {
  normal: { width: 1200, height: 1200, label: "Normal Mode" },
  ge2026: { width: 1200, height: 1694, label: "GE 2026 Mode" },
} as const;

export function DrawingBoard({ mode }: { mode: CanvasMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  const templatePromiseRef = useRef<Promise<HTMLImageElement> | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const [color, setColor] = useState(PALETTES[0].colors[0].color);
  const [brushSize, setBrushSize] = useState(12);
  const [opacity, setOpacity] = useState(100);
  const [erasing, setErasing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [status, setStatus] = useState(`${CANVAS_MODES[mode].label} พร้อมใช้งาน`);
  const canvasConfig = CANVAS_MODES[mode];

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

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
      y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
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

  function saveState() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    historyRef.current.push(
      context.getImageData(0, 0, canvas.width, canvas.height),
    );
    if (historyRef.current.length > HISTORY_LIMIT) {
      historyRef.current.shift();
    }
    setCanUndo(true);
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    event.preventDefault();
    saveState();
    drawingRef.current = true;
    const point = getPoint(event);
    lastPointRef.current = point;
    canvas.setPointerCapture(event.pointerId);

    applyBrush(context);
    context.beginPath();
    context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
    setStatus(erasing ? "กำลังลบ…" : "กำลังวาด…");
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
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

  function stopDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    setStatus(erasing ? "ยางลบพร้อมใช้งาน" : "พู่กันพร้อมใช้งาน");
  }

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const previous = historyRef.current.pop();
    if (!canvas || !context || !previous) return;

    context.putImageData(previous, 0, 0);
    setCanUndo(historyRef.current.length > 0);
    setStatus("ย้อนกลับแล้ว");
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  function chooseColor(nextColor: string) {
    setColor(nextColor);
    setErasing(false);
    setStatus("พู่กันพร้อมใช้งาน");
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    saveState();
    context.clearRect(0, 0, canvas.width, canvas.height);
    setStatus("ล้างพื้นที่วาดแล้ว");
  }

  async function downloadDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setStatus("กำลังเตรียมภาพ PNG…");
      const output = document.createElement("canvas");
      output.width = canvas.width;
      output.height = canvas.height;
      const context = output.getContext("2d", { alpha: false });
      if (!context) return;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, output.width, output.height);
      if (mode === "ge2026") {
        const template = await loadTemplateImage();
        context.drawImage(template, 0, 0, output.width, output.height);
      }
      context.drawImage(canvas, 0, 0);

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2a3d] bg-[#0d0d16] p-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9896b0]">
            {canvasConfig.label}
          </p>
          <p className="mt-1 text-xs text-[#77758a]">
            {mode === "normal" ? "Canvas สี่เหลี่ยมพื้นขาว" : "Canvas แนวตั้งพร้อมพื้นหลัง GE 2026"}
          </p>
        </div>
        <span className="rounded-lg border border-cyan-500/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
          {mode === "normal" ? "1:1 · 1200×1200" : "GE Template · 1200×1694"}
        </span>
      </div>

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

        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="เลือกสี">
          {PALETTES.map((palette) => (
            <div key={palette.name}>
              <p className="mb-2 text-[11px] font-medium text-[#77758a]">
                {palette.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {palette.colors.map((swatch) => (
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
            onClick={clearCanvas}
            className="flex-1 rounded-xl border border-[#343449] bg-[#171724] px-4 py-2.5 text-sm font-semibold text-[#c7c5d2] transition hover:border-pink-500/40 hover:text-pink-200 xl:flex-none"
          >
            ล้างภาพ
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
        <canvas
          ref={canvasRef}
          width={canvasConfig.width}
          height={canvasConfig.height}
          aria-label={mode === "normal" ? "พื้นที่วาดรูปสีขาว" : "พื้นที่วาดรูป GE 2026"}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="mx-auto block h-auto w-full max-w-[1200px] touch-none cursor-crosshair rounded-lg bg-white bg-[length:100%_100%] bg-center bg-no-repeat shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{
            backgroundImage: mode === "ge2026" ? 'url("/GE_template.png")' : undefined,
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#2a2a3d] px-4 py-3 text-xs text-[#77758a]">
        <p role="status">{status}</p>
        <p className="hidden sm:block">กด Ctrl/⌘ + Z เพื่อย้อนกลับ</p>
      </div>
    </section>
  );
}
