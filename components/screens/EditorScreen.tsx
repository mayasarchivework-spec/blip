"use client";

import {
  Check,
  Contrast,
  Download,
  Eraser,
  Grid2X2,
  ImagePlus,
  Layers,
  Move,
  Palette,
  RotateCcw,
  RotateCw,
  ScanLine,
  Sparkles,
  Sun,
  Thermometer,
  Type as TypeIcon,
  Upload,
  Video,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BlipButton } from "@/components/BlipButton";
import type { EditorAdjustment, EditorAdjustments } from "@/data/types";
import { useAppState } from "@/state/AppState";

type EditTarget = "image" | "overlay" | "text";

type ThumbnailItem = {
  id: string;
  label: string;
  url: string;
};

type FilterPreset = {
  name: string;
  sample: string;
  values: {
    brightness: number;
    contrast: number;
    saturate: number;
    sepia: number;
    hue: number;
    grayscale: number;
  };
};

type LayerControls = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  opacity: number;
};

type BlendMode = "source-over" | "screen" | "multiply" | "overlay" | "hard-light";

type TextLayer = {
  content: string;
  fontFamily: string;
  color: string;
  filterName: string;
  adjustments: EditorAdjustments;
  controls: LayerControls;
  blendMode: BlendMode;
};

type RenderSettings = {
  baseImageUrl: string;
  baseFilter: FilterPreset;
  baseAdjustments: EditorAdjustments;
  baseControls: LayerControls;
  pixelReduceEnabled: boolean;
  pixelDetail: number;
  pixelAmount: number;
  overlayImageUrl: string | null;
  overlayFilter: FilterPreset;
  overlayAdjustments: EditorAdjustments;
  overlayControls: LayerControls;
  overlayBlendMode: BlendMode;
  textLayer: TextLayer | null;
};

const cleanFilterName = "Clean";

const filters: FilterPreset[] = [
  {
    name: cleanFilterName,
    sample: "/assets/photo-selfie.svg",
    values: { brightness: 100, contrast: 100, saturate: 100, sepia: 0, hue: 0, grayscale: 0 }
  },
  {
    name: "CCD Flash",
    sample: "/assets/photo-palms.svg",
    values: { brightness: 116, contrast: 118, saturate: 86, sepia: 4, hue: -4, grayscale: 0 }
  },
  {
    name: "Coolpix",
    sample: "/assets/photo-city-road.svg",
    values: { brightness: 92, contrast: 126, saturate: 128, sepia: 0, hue: 188, grayscale: 0 }
  },
  {
    name: "Expired Pink",
    sample: "/assets/photo-palms-night.svg",
    values: { brightness: 108, contrast: 112, saturate: 138, sepia: 8, hue: -18, grayscale: 0 }
  },
  {
    name: "Bleach",
    sample: "/assets/photo-headphones.svg",
    values: { brightness: 106, contrast: 134, saturate: 56, sepia: 4, hue: 0, grayscale: 0 }
  },
  {
    name: "Noir",
    sample: "/assets/photo-skyline.svg",
    values: { brightness: 94, contrast: 132, saturate: 78, sepia: 0, hue: 0, grayscale: 100 }
  }
];

const fontOptions = [
  { label: "System", value: "Arial, Helvetica, sans-serif" },
  { label: "Courier", value: "'Courier New', Courier, monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', Arial, sans-serif" },
  { label: "Impact", value: "Impact, Haettenschweiler, sans-serif" }
];

const neutralAdjustments: EditorAdjustments = {
  brightness: 0,
  contrast: 0,
  fade: 0,
  grain: 0,
  warmth: 0,
  vignette: 0
};

const initialBaseControls: LayerControls = {
  x: 0,
  y: 0,
  scaleX: 100,
  scaleY: 100,
  rotate: 0,
  opacity: 100
};

const initialOverlayControls: LayerControls = {
  x: 0,
  y: 0,
  scaleX: 80,
  scaleY: 80,
  rotate: 0,
  opacity: 92
};

const initialTextControls: LayerControls = {
  x: 0,
  y: 12,
  scaleX: 100,
  scaleY: 100,
  rotate: 0,
  opacity: 100
};

const adjustmentMeta: Array<{
  name: EditorAdjustment;
  label: string;
  icon: ReactNode;
}> = [
  { name: "brightness", label: "Brightness", icon: <Sun size={18} /> },
  { name: "contrast", label: "Contrast", icon: <Contrast size={18} /> },
  { name: "fade", label: "Fade", icon: <Sparkles size={18} /> },
  { name: "grain", label: "Grain", icon: <Grid2X2 size={18} /> },
  { name: "warmth", label: "Warmth", icon: <Thermometer size={18} /> },
  { name: "vignette", label: "Vignette", icon: <Layers size={18} /> }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFilter(name: string) {
  return filters.find((filter) => filter.name === name) ?? filters[0];
}

function makeThumbnail(url: string, label: string): ThumbnailItem {
  return {
    id: `thumb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label,
    url
  };
}

function addThumbnail(items: ThumbnailItem[], url: string, label: string, limit = 12) {
  return [makeThumbnail(url, label), ...items.filter((item) => item.url !== url)].slice(
    0,
    limit
  );
}

function readImageFile(file: File | undefined, onLoad: (dataUrl: string) => void) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      onLoad(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read this file."));
    };
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

function captureVideoFrame(src: string) {
  return new Promise<{ imageUrl: string; width: number; height: number }>((resolve, reject) => {
    const video = document.createElement("video");

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    video.onloadeddata = () => {
      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1920;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not prepare this video."));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      resolve({
        imageUrl: canvas.toDataURL("image/jpeg", 0.88),
        width,
        height
      });
    };
    video.onerror = () => reject(new Error("Could not load this video."));
    video.src = src;
    video.load();
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load editor image."));
    image.src = src;
  });
}

function fitCanvasSize(width: number, height: number) {
  const maxSide = 1500;
  const scale = Math.min(1, maxSide / Math.max(width, height));

  return {
    width: Math.max(320, Math.round(width * scale)),
    height: Math.max(320, Math.round(height * scale))
  };
}

function buildCanvasFilter(preset: FilterPreset, adjustments: EditorAdjustments) {
  const brightness = clamp(preset.values.brightness + adjustments.brightness, 35, 185);
  const contrast = clamp(preset.values.contrast + adjustments.contrast, 35, 205);
  const saturate = clamp(preset.values.saturate - adjustments.fade, 0, 230);
  const sepia = clamp(preset.values.sepia + Math.max(0, adjustments.warmth), 0, 100);
  const hue = preset.values.hue + adjustments.warmth * 0.45;

  return [
    `grayscale(${preset.values.grayscale}%)`,
    `sepia(${sepia}%)`,
    `hue-rotate(${hue}deg)`,
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturate}%)`
  ].join(" ");
}

function copyCanvas(source: HTMLCanvasElement) {
  const copy = document.createElement("canvas");
  copy.width = source.width;
  copy.height = source.height;
  copy.getContext("2d")?.drawImage(source, 0, 0);
  return copy;
}

function applyPixelReduce(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  detail: number,
  amount: number
) {
  if (amount <= 0 || detail >= 100) {
    return;
  }

  const original = copyCanvas(context.canvas);
  const pixelated = document.createElement("canvas");
  const pixelatedContext = pixelated.getContext("2d");

  if (!pixelatedContext) {
    return;
  }

  const detailScale = clamp(detail, 5, 100) / 100;
  pixelated.width = Math.max(8, Math.round(width * detailScale));
  pixelated.height = Math.max(8, Math.round(height * detailScale));
  pixelatedContext.imageSmoothingEnabled = true;
  pixelatedContext.drawImage(original, 0, 0, pixelated.width, pixelated.height);

  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = clamp(amount, 0, 100) / 100;
  context.drawImage(pixelated, 0, 0, pixelated.width, pixelated.height, 0, 0, width, height);
  context.restore();
}

function applyGrain(context: CanvasRenderingContext2D, width: number, height: number, value: number) {
  if (value <= 0) {
    return;
  }

  const noise = document.createElement("canvas");
  const noiseContext = noise.getContext("2d");

  if (!noiseContext) {
    return;
  }

  noise.width = 130;
  noise.height = 130;
  const imageData = noiseContext.createImageData(noise.width, noise.height);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const shade = Math.random() * 255;
    imageData.data[index] = shade;
    imageData.data[index + 1] = shade;
    imageData.data[index + 2] = shade;
    imageData.data[index + 3] = 255;
  }

  noiseContext.putImageData(imageData, 0, 0);
  const pattern = context.createPattern(noise, "repeat");

  if (!pattern) {
    return;
  }

  context.save();
  context.globalAlpha = clamp(value, 0, 60) / 210;
  context.globalCompositeOperation = "overlay";
  context.fillStyle = pattern;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function applyVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  value: number
) {
  if (value <= 0) {
    return;
  }

  const radius = Math.max(width, height) * 0.72;
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.24,
    width / 2,
    height / 2,
    radius
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${clamp(value, 0, 60) / 92})`);
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function wrapLine(
  context: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
) {
  const words = line.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth || !current) {
      current = next;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function drawTextLayer(
  context: CanvasRenderingContext2D,
  textLayer: TextLayer,
  filter: FilterPreset,
  width: number,
  height: number
) {
  const content = textLayer.content.trim();

  if (!content) {
    return;
  }

  const fontSize = Math.max(28, Math.round(width * 0.08));
  const maxTextWidth = width * 0.74;

  context.save();
  context.globalAlpha = textLayer.controls.opacity / 100;
  context.globalCompositeOperation = textLayer.blendMode;
  context.filter = buildCanvasFilter(filter, textLayer.adjustments);
  context.translate(
    width / 2 + (textLayer.controls.x / 100) * width * 0.5,
    height / 2 + (textLayer.controls.y / 100) * height * 0.5
  );
  context.rotate((textLayer.controls.rotate * Math.PI) / 180);
  context.scale(textLayer.controls.scaleX / 100, textLayer.controls.scaleY / 100);
  context.font = `800 ${fontSize}px ${textLayer.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = Math.max(4, Math.round(fontSize * 0.09));
  context.strokeStyle = "rgba(0, 0, 0, 0.58)";
  context.fillStyle = textLayer.color;

  const lines = content
    .split(/\n/)
    .flatMap((line) => wrapLine(context, line, maxTextWidth));
  const lineHeight = fontSize * 1.14;
  const startY = -((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    context.strokeText(line, 0, y);
    context.fillText(line, 0, y);
  });

  context.restore();
  context.globalCompositeOperation = "source-over";
  context.filter = "none";
}

async function renderCompositeToCanvas(canvas: HTMLCanvasElement, settings: RenderSettings) {
  const baseImage = await loadImage(settings.baseImageUrl);
  const size = fitCanvasSize(
    baseImage.naturalWidth || baseImage.width,
    baseImage.naturalHeight || baseImage.height
  );
  const context = canvas.getContext("2d");

  if (!context) {
    return size;
  }

  canvas.width = size.width;
  canvas.height = size.height;
  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = "#050505";
  context.fillRect(0, 0, size.width, size.height);

  context.save();
  context.globalAlpha = settings.baseControls.opacity / 100;
  context.filter = buildCanvasFilter(settings.baseFilter, settings.baseAdjustments);
  context.translate(
    size.width / 2 + (settings.baseControls.x / 100) * size.width * 0.5,
    size.height / 2 + (settings.baseControls.y / 100) * size.height * 0.5
  );
  context.rotate((settings.baseControls.rotate * Math.PI) / 180);
  context.scale(settings.baseControls.scaleX / 100, settings.baseControls.scaleY / 100);
  context.drawImage(baseImage, -size.width / 2, -size.height / 2, size.width, size.height);
  context.restore();
  context.filter = "none";

  if (settings.pixelReduceEnabled) {
    applyPixelReduce(
      context,
      size.width,
      size.height,
      settings.pixelDetail,
      settings.pixelAmount
    );
  }

  if (settings.overlayImageUrl) {
    const overlayImage = await loadImage(settings.overlayImageUrl);
    const overlayScale = Math.min(
      (size.width * 0.68) / (overlayImage.naturalWidth || overlayImage.width),
      (size.height * 0.68) / (overlayImage.naturalHeight || overlayImage.height)
    );
    const drawWidth = (overlayImage.naturalWidth || overlayImage.width) * overlayScale;
    const drawHeight = (overlayImage.naturalHeight || overlayImage.height) * overlayScale;

    context.save();
    context.globalAlpha = settings.overlayControls.opacity / 100;
    context.globalCompositeOperation = settings.overlayBlendMode;
    context.filter = buildCanvasFilter(settings.overlayFilter, settings.overlayAdjustments);
    context.translate(
      size.width / 2 + (settings.overlayControls.x / 100) * size.width * 0.5,
      size.height / 2 + (settings.overlayControls.y / 100) * size.height * 0.5
    );
    context.rotate((settings.overlayControls.rotate * Math.PI) / 180);
    context.scale(settings.overlayControls.scaleX / 100, settings.overlayControls.scaleY / 100);
    context.drawImage(overlayImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();
    context.globalCompositeOperation = "source-over";
    context.filter = "none";
  }

  if (settings.textLayer) {
    drawTextLayer(
      context,
      settings.textLayer,
      getFilter(settings.textLayer.filterName),
      size.width,
      size.height
    );
  }

  applyGrain(context, size.width, size.height, settings.baseAdjustments.grain);
  applyVignette(context, size.width, size.height, settings.baseAdjustments.vignette);

  return size;
}

function FxSlider({
  disabled,
  icon,
  label,
  max,
  min,
  onChange,
  suffix = "",
  value
}: {
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix?: string;
  value: number;
}) {
  return (
    <label className={`fx-slider ${disabled ? "is-disabled" : ""}`}>
      <span className="fx-slider-icon">{icon}</span>
      <span>{label}</span>
      <input
        disabled={disabled}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>
        {value > 0 && min < 0 ? "+" : ""}
        {value}
        {suffix}
      </output>
    </label>
  );
}

function formatHashtags(value: string) {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`);
}

function buildPublishCaption(caption: string, hashtags: string) {
  const cleanCaption = caption.trim();
  const tagText = formatHashtags(hashtags).join(" ");

  return [cleanCaption, tagText].filter(Boolean).join(" ");
}

export function EditorScreen() {
  const router = useRouter();
  const {
    addLocalPost,
    createInstant,
    currentUser,
    editorAdjustments,
    editorFilter,
    setEditorAdjustment,
    setEditorFilter
  } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderVersion = useRef(0);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [baseVersions, setBaseVersions] = useState<ThumbnailItem[]>([]);
  const [baseHistoryIndex, setBaseHistoryIndex] = useState(-1);
  const [baseControls, setBaseControls] = useState<LayerControls>(initialBaseControls);
  const [wholeFilterName, setWholeFilterName] = useState(() => getFilter(editorFilter).name);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(null);
  const [overlayUploads, setOverlayUploads] = useState<ThumbnailItem[]>([]);
  const [overlayFilterName, setOverlayFilterName] = useState(cleanFilterName);
  const [overlayAdjustments, setOverlayAdjustments] =
    useState<EditorAdjustments>(neutralAdjustments);
  const [overlayControls, setOverlayControls] =
    useState<LayerControls>(initialOverlayControls);
  const [overlayBlendMode, setOverlayBlendMode] = useState<BlendMode>("source-over");
  const [textLayer, setTextLayer] = useState<TextLayer | null>(null);
  const [activeTarget, setActiveTarget] = useState<EditTarget>("image");
  const [pixelReduceEnabled, setPixelReduceEnabled] = useState(false);
  const [pixelDetail, setPixelDetail] = useState(42);
  const [pixelAmount, setPixelAmount] = useState(100);
  const [previewSize, setPreviewSize] = useState({ width: 1080, height: 1350 });
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"post" | "instant" | null>(null);
  const [publishCaption, setPublishCaption] = useState("");
  const [publishHashtags, setPublishHashtags] = useState("");

  const wholeFilter = getFilter(wholeFilterName);
  const overlayFilter = getFilter(overlayFilterName);
  const currentFilterName =
    activeTarget === "overlay"
      ? overlayFilterName
      : activeTarget === "text"
        ? textLayer?.filterName ?? cleanFilterName
        : wholeFilterName;
  const currentAdjustments =
    activeTarget === "overlay"
      ? overlayAdjustments
      : activeTarget === "text"
        ? textLayer?.adjustments ?? neutralAdjustments
        : editorAdjustments;
  const currentControls =
    activeTarget === "overlay"
      ? overlayControls
      : activeTarget === "text"
        ? textLayer?.controls ?? initialTextControls
        : baseControls;
  const canEditOverlay = Boolean(overlayImageUrl);
  const canEditText = Boolean(textLayer);
  const canTransformTarget =
    Boolean(baseImageUrl) &&
    (activeTarget === "image" ||
      (activeTarget === "overlay" && canEditOverlay) ||
      (activeTarget === "text" && canEditText));
  const canUndo = baseHistoryIndex > 0;
  const canRedo = baseHistoryIndex >= 0 && baseHistoryIndex < baseVersions.length - 1;
  const filterThumbnail =
    activeTarget === "overlay" && overlayImageUrl
      ? overlayImageUrl
      : activeTarget === "text"
        ? baseImageUrl
        : baseImageUrl;
  const previewStyle = {
    "--fx-preview-aspect": `${previewSize.width} / ${previewSize.height}`
  } as CSSProperties;

  const renderSettings = useMemo<RenderSettings | null>(() => {
    if (!baseImageUrl) {
      return null;
    }

    return {
      baseImageUrl,
      baseFilter: wholeFilter,
      baseAdjustments: editorAdjustments,
      baseControls,
      pixelReduceEnabled,
      pixelDetail,
      pixelAmount,
      overlayImageUrl,
      overlayFilter,
      overlayAdjustments,
      overlayControls,
      overlayBlendMode,
      textLayer
    };
  }, [
    baseControls,
    baseImageUrl,
    editorAdjustments,
    overlayAdjustments,
    overlayBlendMode,
    overlayControls,
    overlayFilter,
    overlayImageUrl,
    pixelAmount,
    pixelDetail,
    pixelReduceEnabled,
    textLayer,
    wholeFilter
  ]);

  const resetWholeAdjustments = useCallback(() => {
    Object.entries(neutralAdjustments).forEach(([name, value]) => {
      setEditorAdjustment(name as EditorAdjustment, value);
    });
  }, [setEditorAdjustment]);

  const resetPendingEdits = useCallback(() => {
    setWholeFilterName(cleanFilterName);
    setEditorFilter(cleanFilterName);
    resetWholeAdjustments();
    setBaseControls(initialBaseControls);
    setOverlayFilterName(cleanFilterName);
    setOverlayAdjustments(neutralAdjustments);
    setOverlayControls(initialOverlayControls);
    setOverlayBlendMode("source-over");
    setOverlayImageUrl(null);
    setTextLayer(null);
    setActiveTarget("image");
    setPixelReduceEnabled(false);
    setPixelDetail(42);
    setPixelAmount(100);
  }, [resetWholeAdjustments, setEditorFilter]);

  useEffect(() => {
    setWholeFilterName(cleanFilterName);
    setEditorFilter(cleanFilterName);
    resetWholeAdjustments();
  }, [resetWholeAdjustments, setEditorFilter]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    if (!renderSettings) {
      canvas.width = previewSize.width;
      canvas.height = previewSize.height;
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const version = renderVersion.current + 1;
    renderVersion.current = version;
    setIsRendering(true);

    void renderCompositeToCanvas(canvas, renderSettings)
      .then((nextSize) => {
        if (renderVersion.current !== version) {
          return;
        }

        setPreviewSize((size) =>
          size.width === nextSize.width && size.height === nextSize.height ? size : nextSize
        );
      })
      .catch(() => setStatus("That image could not be loaded."))
      .finally(() => {
        if (renderVersion.current === version) {
          setIsRendering(false);
        }
      });
  }, [previewSize.height, previewSize.width, renderSettings]);

  function updateTextLayer(updates: Partial<TextLayer>) {
    setTextLayer((layer) => (layer ? { ...layer, ...updates } : layer));
  }

  function setFilterForActiveTarget(name: string) {
    if (activeTarget === "overlay") {
      setOverlayFilterName(name);
      return;
    }

    if (activeTarget === "text") {
      updateTextLayer({ filterName: name });
      return;
    }

    setWholeFilterName(name);
    setEditorFilter(name);
  }

  function setAdjustmentForActiveTarget(name: EditorAdjustment, value: number) {
    if (activeTarget === "overlay") {
      setOverlayAdjustments((adjustments) => ({
        ...adjustments,
        [name]: value
      }));
      return;
    }

    if (activeTarget === "text") {
      setTextLayer((layer) =>
        layer
          ? {
              ...layer,
              adjustments: {
                ...layer.adjustments,
                [name]: value
              }
            }
          : layer
      );
      return;
    }

    setEditorAdjustment(name, value);
  }

  function setControlForActiveTarget(name: keyof LayerControls, value: number) {
    if (activeTarget === "overlay") {
      setOverlayControls((controls) => ({
        ...controls,
        [name]: value
      }));
      return;
    }

    if (activeTarget === "text") {
      setTextLayer((layer) =>
        layer
          ? {
              ...layer,
              controls: {
                ...layer.controls,
                [name]: value
              }
            }
          : layer
      );
      return;
    }

    setBaseControls((controls) => ({
      ...controls,
      [name]: value
    }));
  }

  function loadBaseImage(url: string, addToHistory = true, existingIndex?: number) {
    setBaseImageUrl(url);
    resetPendingEdits();

    if (typeof existingIndex === "number") {
      setBaseHistoryIndex(existingIndex);
      setStatus("Base version selected");
      return;
    }

    if (addToHistory) {
      const first = makeThumbnail(url, "Upload");
      setBaseVersions([first]);
      setBaseHistoryIndex(0);
    }

    setStatus("Base image loaded");
  }

  async function chooseBaseFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("video/")) {
      setSourceVideoUrl(null);
      readImageFile(file, loadBaseImage);
      return;
    }

    setStatus("Loading video cover");

    try {
      const videoUrl = await readFileAsDataUrl(file);
      const frame = await captureVideoFrame(videoUrl);
      setSourceVideoUrl(videoUrl);
      loadBaseImage(frame.imageUrl);
      setPreviewSize(fitCanvasSize(frame.width, frame.height));
      setStatus("Video cover loaded");
    } catch {
      setStatus("Could not load this video");
    }
  }

  function loadOverlayImage(url: string, addToHistory = true) {
    setOverlayImageUrl(url);
    setOverlayFilterName(cleanFilterName);
    setOverlayAdjustments(neutralAdjustments);
    setOverlayControls(initialOverlayControls);
    setActiveTarget("overlay");

    if (addToHistory) {
      setOverlayUploads((items) => addThumbnail(items, url, "Overlay"));
    }

    setStatus("Overlay added");
  }

  function addTextLayer() {
    if (!baseImageUrl) {
      setStatus("Add a base image first");
      return;
    }

    setTextLayer({
      content: "blip text",
      fontFamily: fontOptions[1].value,
      color: "#ffffff",
      filterName: cleanFilterName,
      adjustments: neutralAdjustments,
      controls: initialTextControls,
      blendMode: "source-over"
    });
    setActiveTarget("text");
    setStatus("Text added");
  }

  function pushBaseHistory(dataUrl: string) {
    const nextLabel = `Edit ${baseHistoryIndex + 1}`;

    setBaseVersions((items) => {
      const kept = baseHistoryIndex >= 0 ? items.slice(0, baseHistoryIndex + 1) : [];
      const next = [...kept, makeThumbnail(dataUrl, nextLabel)];
      setBaseHistoryIndex(next.length - 1);
      return next;
    });
  }

  async function applyEdits() {
    const canvas = canvasRef.current;

    if (!canvas || !renderSettings) {
      setStatus("Add a base image first");
      return null;
    }

    setIsRendering(true);

    try {
      const nextSize = await renderCompositeToCanvas(canvas, renderSettings);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setBaseImageUrl(dataUrl);
      setPreviewSize(nextSize);
      pushBaseHistory(dataUrl);
      resetPendingEdits();
      setStatus("Applied");
      window.setTimeout(() => setStatus(""), 1200);
      return dataUrl;
    } catch {
      setStatus("Could not apply this edit");
      return null;
    } finally {
      setIsRendering(false);
    }
  }

  function stepHistory(direction: -1 | 1) {
    const nextIndex = baseHistoryIndex + direction;
    const item = baseVersions[nextIndex];

    if (!item) {
      return;
    }

    setBaseHistoryIndex(nextIndex);
    setBaseImageUrl(item.url);
    resetPendingEdits();
    setStatus(direction < 0 ? "Undo" : "Redo");
    window.setTimeout(() => setStatus(""), 900);
  }

  function clearEditor() {
    setBaseImageUrl(null);
    setSourceVideoUrl(null);
    setBaseVersions([]);
    setBaseHistoryIndex(-1);
    setOverlayUploads([]);
    resetPendingEdits();
    setStatus("");
  }

  async function saveEdit() {
    const canvas = canvasRef.current;

    if (!canvas || !renderSettings) {
      setStatus("Add a base image first");
      return;
    }

    setIsRendering(true);

    try {
      await renderCompositeToCanvas(canvas, renderSettings);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `blip-edit-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSaved(true);
      setStatus("Saved to device");
      window.setTimeout(() => {
        setSaved(false);
        setStatus("");
      }, 1200);
    } catch {
      setStatus("Could not save this image");
    } finally {
      setIsRendering(false);
    }
  }

  function openPublish(mode: "post" | "instant") {
    if (!baseImageUrl || isRendering) {
      setStatus("Add a base image first");
      return;
    }

    setPublishMode(mode);
  }

  async function postEdit() {
    const imageUrl = await applyEdits();

    if (!imageUrl) {
      return;
    }

    const caption = buildPublishCaption(publishCaption, publishHashtags);

    addLocalPost({
      type: sourceVideoUrl ? "video" : "photo",
      content:
        publishCaption.trim() ||
        formatHashtags(publishHashtags).join(" ") ||
        (sourceVideoUrl ? "edited video" : "edited photo"),
      imageUrl,
      videoUrl: sourceVideoUrl ?? undefined,
      caption: caption || undefined
    });
    setPublishMode(null);
    setPublishCaption("");
    setPublishHashtags("");
    setStatus("Posted to profile");
    window.setTimeout(() => router.push(`/profile/${currentUser.username}`), 450);
  }

  async function instantEdit() {
    const imageUrl = await applyEdits();

    if (!imageUrl) {
      return;
    }

    const caption = buildPublishCaption(publishCaption, publishHashtags);

    createInstant({
      type: sourceVideoUrl ? "video" : "photo",
      content: caption || "edited Instant",
      thumbnailUrl: imageUrl,
      videoUrl: sourceVideoUrl ?? undefined
    });
    setPublishMode(null);
    setPublishCaption("");
    setPublishHashtags("");
    setStatus("Instant posted");
    window.setTimeout(() => setStatus(""), 1200);
  }

  return (
    <div className="screen editor-screen fx-editor-screen">
      <AppHeader title="Editor" />
      <div className="fx-workbench">
        <section className="fx-stage-card">
          <div className="fx-toolbar">
            <span>BLIP FX</span>
            <strong>{baseImageUrl ? currentFilterName : "No image"}</strong>
            <button type="button" disabled={!baseImageUrl || isRendering} onClick={applyEdits}>
              Apply
            </button>
          </div>
          <div
            className={`fx-preview ${baseImageUrl ? "has-image" : "is-blank"}`}
            style={previewStyle}
          >
            <canvas ref={canvasRef} aria-label="Editor preview" />
            {!baseImageUrl ? (
              <div className="fx-empty-state">
                <ImagePlus size={38} />
                <strong>Upload base image</strong>
                <label className="fx-file-button">
                  <ImagePlus size={18} />
                  Choose photo
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => void chooseBaseFile(event.target.files?.[0])}
                  />
                </label>
              </div>
            ) : null}
            {isRendering && baseImageUrl ? <span className="fx-render-badge">rendering</span> : null}
          </div>
          <div className="fx-action-row">
            <BlipButton type="button" disabled={!baseImageUrl || isRendering} onClick={applyEdits}>
              <Check size={18} />
              Apply
            </BlipButton>
            <BlipButton
              type="button"
              variant="secondary"
              disabled={!canUndo || isRendering}
              onClick={() => stepHistory(-1)}
            >
              <RotateCcw size={18} />
              Undo
            </BlipButton>
            <BlipButton
              type="button"
              variant="secondary"
              disabled={!canRedo || isRendering}
              onClick={() => stepHistory(1)}
            >
              <RotateCw size={18} />
              Redo
            </BlipButton>
            <BlipButton type="button" variant="secondary" onClick={resetPendingEdits}>
              <Eraser size={18} />
              Reset FX
            </BlipButton>
            <BlipButton
              type="button"
              variant="secondary"
              disabled={!baseImageUrl || isRendering}
              onClick={saveEdit}
            >
              <Download size={18} />
              {saved ? "Saved" : "Save"}
            </BlipButton>
            <BlipButton
              type="button"
              disabled={!baseImageUrl || isRendering}
              onClick={() => openPublish("instant")}
            >
              <Video size={18} />
              Instant
            </BlipButton>
            <BlipButton
              type="button"
              disabled={!baseImageUrl || isRendering}
              onClick={() => openPublish("post")}
            >
              <Upload size={18} />
              Post
            </BlipButton>
          </div>
          <div className="fx-status-row">
            <span>{status}</span>
            <button type="button" onClick={clearEditor}>
              <Eraser size={16} />
              Clear
            </button>
          </div>
        </section>

        <aside className="fx-panel fx-controls-panel">
          <div className="fx-panel-title">
            <ImagePlus size={18} />
            <strong>Image</strong>
          </div>
          <div className="fx-upload-grid">
            <label className="fx-file-button">
              <ImagePlus size={18} />
              Base
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => void chooseBaseFile(event.target.files?.[0])}
              />
            </label>
            <label className="fx-file-button fx-file-secondary">
              <Layers size={18} />
              Overlay
              <input
                type="file"
                accept="image/*"
                disabled={!baseImageUrl}
                onChange={(event) => readImageFile(event.target.files?.[0], loadOverlayImage)}
              />
            </label>
            <button
              type="button"
              className="fx-file-button fx-file-secondary"
              disabled={!baseImageUrl}
              onClick={addTextLayer}
            >
              <TypeIcon size={18} />
              Text
            </button>
          </div>
          <div className="fx-history-section">
            <div className="fx-history-heading">
              <strong>Base versions</strong>
              <span>{baseVersions.length}</span>
            </div>
            {baseVersions.length ? (
              <div className="fx-thumb-strip">
                {baseVersions
                  .map((item, index) => ({ item, index }))
                  .reverse()
                  .map(({ item, index }) => (
                    <button
                      key={item.id}
                      type="button"
                      className={baseHistoryIndex === index ? "active" : ""}
                      onClick={() => loadBaseImage(item.url, false, index)}
                    >
                      <img src={item.url} alt="" />
                      <span>{item.label}</span>
                    </button>
                  ))}
              </div>
            ) : (
              <p className="fx-history-empty">No base uploads yet.</p>
            )}
          </div>
          <div className="fx-history-section">
            <div className="fx-history-heading">
              <strong>Overlays</strong>
              <span>{overlayUploads.length}</span>
            </div>
            {overlayUploads.length ? (
              <div className="fx-thumb-strip">
                {overlayUploads.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={overlayImageUrl === item.url ? "active" : ""}
                    disabled={!baseImageUrl}
                    onClick={() => loadOverlayImage(item.url, false)}
                  >
                    <img src={item.url} alt="" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="fx-history-empty">No overlays yet.</p>
            )}
          </div>

          <div className="fx-panel-title">
            <Palette size={18} />
            <strong>Target</strong>
          </div>
          <div className="fx-target-switch">
            <button
              type="button"
              className={activeTarget === "image" ? "active" : ""}
              disabled={!baseImageUrl}
              onClick={() => setActiveTarget("image")}
            >
              Image
            </button>
            <button
              type="button"
              className={activeTarget === "overlay" ? "active" : ""}
              disabled={!canEditOverlay}
              onClick={() => setActiveTarget("overlay")}
            >
              Overlay
            </button>
            <button
              type="button"
              className={activeTarget === "text" ? "active" : ""}
              disabled={!canEditText}
              onClick={() => setActiveTarget("text")}
            >
              Text
            </button>
          </div>

          <div className="fx-panel-title">
            <Sparkles size={18} />
            <strong>Filters</strong>
          </div>
          <div className="fx-filter-strip">
            {filters.map((filter) => (
              <button
                key={filter.name}
                type="button"
                className={currentFilterName === filter.name ? "active" : ""}
                disabled={!baseImageUrl}
                onClick={() => setFilterForActiveTarget(filter.name)}
              >
                <img src={filterThumbnail ?? filter.sample} alt="" />
                <span>{filter.name}</span>
              </button>
            ))}
          </div>

          <div className="fx-panel-title">
            <ScanLine size={18} />
            <strong>Pixel reduce</strong>
          </div>
          <div className="fx-toggle-row">
            <button
              type="button"
              className={pixelReduceEnabled ? "active" : ""}
              disabled={!baseImageUrl || activeTarget !== "image"}
              onClick={() => setPixelReduceEnabled((value) => !value)}
            >
              <ScanLine size={17} />
              Pixels
            </button>
          </div>
          <div className="fx-slider-stack">
            <FxSlider
              disabled={!baseImageUrl || activeTarget !== "image" || !pixelReduceEnabled}
              label="Pixels"
              min={5}
              max={100}
              suffix="%"
              value={pixelDetail}
              onChange={setPixelDetail}
            />
            <FxSlider
              disabled={!baseImageUrl || activeTarget !== "image" || !pixelReduceEnabled}
              label="Crush"
              min={0}
              max={100}
              suffix="%"
              value={pixelAmount}
              onChange={setPixelAmount}
            />
          </div>

          <div className="fx-panel-title">
            <Move size={18} />
            <strong>Adjust</strong>
          </div>
          <div className="fx-slider-stack">
            {adjustmentMeta.map((adjustment) => (
              <FxSlider
                key={adjustment.name}
                disabled={!baseImageUrl || (activeTarget === "text" && !textLayer)}
                icon={adjustment.icon}
                label={adjustment.label}
                min={-60}
                max={60}
                value={currentAdjustments[adjustment.name]}
                onChange={(value) => setAdjustmentForActiveTarget(adjustment.name, value)}
              />
            ))}
          </div>

          <div className="fx-panel-title">
            <RotateCw size={18} />
            <strong>Transform</strong>
          </div>
          <div className="fx-slider-stack">
            <FxSlider
              disabled={!canTransformTarget}
              label="X scale"
              min={20}
              max={220}
              suffix="%"
              value={currentControls.scaleX}
              onChange={(value) => setControlForActiveTarget("scaleX", value)}
            />
            <FxSlider
              disabled={!canTransformTarget}
              label="Y scale"
              min={20}
              max={220}
              suffix="%"
              value={currentControls.scaleY}
              onChange={(value) => setControlForActiveTarget("scaleY", value)}
            />
            <FxSlider
              disabled={!canTransformTarget}
              label="Rotate"
              min={-180}
              max={180}
              suffix="deg"
              value={currentControls.rotate}
              onChange={(value) => setControlForActiveTarget("rotate", value)}
            />
            <FxSlider
              disabled={!canTransformTarget}
              label="X move"
              min={-100}
              max={100}
              suffix="%"
              value={currentControls.x}
              onChange={(value) => setControlForActiveTarget("x", value)}
            />
            <FxSlider
              disabled={!canTransformTarget}
              label="Y move"
              min={-100}
              max={100}
              suffix="%"
              value={currentControls.y}
              onChange={(value) => setControlForActiveTarget("y", value)}
            />
            <FxSlider
              disabled={!canTransformTarget}
              label="Opacity"
              min={0}
              max={100}
              suffix="%"
              value={currentControls.opacity}
              onChange={(value) => setControlForActiveTarget("opacity", value)}
            />
          </div>
          <label className="blend-select fx-blend-select">
            <Layers size={18} />
            <span>Blend</span>
            <select
              disabled={activeTarget === "image" || !canTransformTarget}
              value={activeTarget === "text" ? textLayer?.blendMode ?? "source-over" : overlayBlendMode}
              onChange={(event) => {
                const blend = event.target.value as BlendMode;
                if (activeTarget === "text") {
                  updateTextLayer({ blendMode: blend });
                  return;
                }
                setOverlayBlendMode(blend);
              }}
            >
              <option value="source-over">normal</option>
              <option value="screen">screen</option>
              <option value="multiply">multiply</option>
              <option value="overlay">overlay</option>
              <option value="hard-light">hard light</option>
            </select>
          </label>

          <div className="fx-panel-title">
            <TypeIcon size={18} />
            <strong>Text</strong>
          </div>
          <label className="fx-text-field">
            <span>Content</span>
            <textarea
              disabled={!textLayer}
              value={textLayer?.content ?? ""}
              onChange={(event) => updateTextLayer({ content: event.target.value })}
            />
          </label>
          <div className="fx-text-options">
            <label className="fx-text-field">
              <span>Font</span>
              <select
                disabled={!textLayer}
                value={textLayer?.fontFamily ?? fontOptions[0].value}
                onChange={(event) => updateTextLayer({ fontFamily: event.target.value })}
              >
                {fontOptions.map((font) => (
                  <option key={font.label} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="fx-color-field">
              <span>Color</span>
              <input
                disabled={!textLayer}
                type="color"
                value={textLayer?.color ?? "#ffffff"}
                onChange={(event) => updateTextLayer({ color: event.target.value })}
              />
            </label>
          </div>
        </aside>
      </div>
      {publishMode ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="editor-publish-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setPublishMode(null)}
              aria-label="Close publish panel"
            >
              <X size={20} />
            </button>
            <h2>{publishMode === "post" ? "Post edit" : "Post Instant"}</h2>
            <p>
              Add the words before it goes live.
            </p>
            <label className="fx-text-field">
              <span>Caption</span>
              <textarea
                value={publishCaption}
                maxLength={220}
                onChange={(event) => setPublishCaption(event.target.value)}
                placeholder="say something..."
              />
            </label>
            <label className="fx-text-field">
              <span>Hashtags</span>
              <input
                value={publishHashtags}
                onChange={(event) => setPublishHashtags(event.target.value)}
                placeholder="#night #blip"
              />
            </label>
            <div className="editor-publish-preview">
              <strong>Preview caption</strong>
              <span>{buildPublishCaption(publishCaption, publishHashtags) || "No caption yet"}</span>
            </div>
            <BlipButton
              type="button"
              disabled={!baseImageUrl || isRendering}
              onClick={publishMode === "post" ? postEdit : instantEdit}
              wide
            >
              <Upload size={18} />
              {publishMode === "post" ? "Publish post" : "Publish Instant"}
            </BlipButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
