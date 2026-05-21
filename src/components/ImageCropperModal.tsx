import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageCropperModalProps {
  file: File;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
}

export default function ImageCropperModal({ file, onCropComplete, onClose }: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // default to 16:9 for streaming
  const [aspectLabel, setAspectLabel] = useState<string>('16:9');
  
  // Crop area offset
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Size constraints and edits
  const [targetWidth, setTargetWidth] = useState<number>(1280);
  const [targetHeight, setTargetHeight] = useState<number>(720);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [quality, setQuality] = useState<number>(0.85); // Compress to keep under 4MB
  const [cropBoxScale, setCropBoxScale] = useState<number>(0.9); // default to 90% of max fit

  // Interactive Resizing States
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const activeHandleRef = useRef<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0 });
  const dimsStart = useRef({ width: 1280, height: 720 });
  
  const imgRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Load image
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // Hook for mouse wheel scroll zooming inside the viewport for maximum user convenience
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const onWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = 0.08;
      const direction = e.deltaY < 0 ? 1 : -1;
      setZoom((prevZoom) => Math.min(4, Math.max(0.4, prevZoom + direction * zoomFactor)));
    };

    container.addEventListener('wheel', onWheelEvent, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelEvent);
    };
  }, []);

  // Handle aspect ratio preset change
  const handleAspectChange = (ratio: number, label: string) => {
    setAspectRatio(ratio);
    setAspectLabel(label);
    
    // Scale target dimensions based on new aspect
    if (ratio > 0) {
      const newHeight = Math.round(targetWidth / ratio);
      setTargetHeight(newHeight);
    }
    // Centering reset
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setCropBoxScale(0.9);
  };

  // Dimensions change handlers
  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (keepAspect && aspectRatio > 0) {
      setTargetHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (keepAspect && aspectRatio > 0) {
      setTargetWidth(Math.round(val * aspectRatio));
    }
  };

  // Helper to calculate and perform resizing of the crop box so it physically tracks the mouse cursor
  const performResize = (clientX: number, clientY: number) => {
    const container = viewportRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Find the center of the viewport container
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const containerW = rect.width;
    const containerH = rect.height;
    
    // Find maximum fitting crop box dimensions inside this viewport
    let maxW = containerW;
    let maxH = containerW / aspectRatio;
    if (maxH > containerH) {
      maxH = containerH;
      maxW = containerH * aspectRatio;
    }

    const handle = activeHandleRef.current;
    if (!handle) return;

    if (!keepAspect) {
      const progressX = clientX - resizeStart.current.x;
      const progressY = clientY - resizeStart.current.y;
      
      const pixelScale = dimsStart.current.width / container.clientWidth;
      
      let newWidth = dimsStart.current.width;
      let newHeight = dimsStart.current.height;
      
      switch (handle) {
        case 'r':
          newWidth = dimsStart.current.width + Math.round(progressX * pixelScale * 2);
          break;
        case 'l':
          newWidth = dimsStart.current.width - Math.round(progressX * pixelScale * 2);
          break;
        case 'b':
          newHeight = dimsStart.current.height + Math.round(progressY * pixelScale * 2);
          break;
        case 't':
          newHeight = dimsStart.current.height - Math.round(progressY * pixelScale * 2);
          break;
        case 'br':
          newWidth = dimsStart.current.width + Math.round(progressX * pixelScale * 2);
          newHeight = dimsStart.current.height + Math.round(progressY * pixelScale * 2);
          break;
        case 'tl':
          newWidth = dimsStart.current.width - Math.round(progressX * pixelScale * 2);
          newHeight = dimsStart.current.height - Math.round(progressY * pixelScale * 2);
          break;
        case 'tr':
          newWidth = dimsStart.current.width + Math.round(progressX * pixelScale * 2);
          newHeight = dimsStart.current.height - Math.round(progressY * pixelScale * 2);
          break;
        case 'bl':
          newWidth = dimsStart.current.width - Math.round(progressX * pixelScale * 2);
          newHeight = dimsStart.current.height + Math.round(progressY * pixelScale * 2);
          break;
      }
      
      newWidth = Math.max(160, Math.min(3840, newWidth));
      newHeight = Math.max(90, Math.min(2160, newHeight));
      
      setTargetWidth(newWidth);
      setTargetHeight(newHeight);
      
      const newAspect = newWidth / newHeight;
      setAspectRatio(newAspect);
      setAspectLabel(`${newWidth}x${newHeight}`);
    } else {
      // Locked aspect ratio mode
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      
      let scaleX = 1;
      let scaleY = 1;
      
      switch (handle) {
        case 'br':
          scaleX = (2 * dx) / maxW;
          scaleY = (2 * dy) / maxH;
          break;
        case 'tl':
          scaleX = (2 * -dx) / maxW;
          scaleY = (2 * -dy) / maxH;
          break;
        case 'tr':
          scaleX = (2 * dx) / maxW;
          scaleY = (2 * -dy) / maxH;
          break;
        case 'bl':
          scaleX = (2 * -dx) / maxW;
          scaleY = (2 * dy) / maxH;
          break;
        case 't':
          scaleY = (2 * -dy) / maxH;
          scaleX = scaleY;
          break;
        case 'b':
          scaleY = (2 * dy) / maxH;
          scaleX = scaleY;
          break;
        case 'l':
          scaleX = (2 * -dx) / maxW;
          scaleY = scaleX;
          break;
        case 'r':
          scaleX = (2 * dx) / maxW;
          scaleY = scaleX;
          break;
      }
      
      const newScale = Math.max(0.15, Math.min(1.0, (scaleX + scaleY) / 2));
      setCropBoxScale(newScale);
    }
  };

  // Interactive Resizing handlers via corner/edge mouse drag
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setActiveHandle(direction);
    activeHandleRef.current = direction;
    resizeStart.current = { x: e.clientX, y: e.clientY };
    dimsStart.current = { width: targetWidth, height: targetHeight };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    performResize(e.clientX, e.clientY);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setActiveHandle(null);
    activeHandleRef.current = null;
  };

  // Touch Support for resizing
  const handleResizeTouchStart = (e: React.TouchEvent, direction: string) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    setIsResizing(true);
    setActiveHandle(direction);
    activeHandleRef.current = direction;
    resizeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dimsStart.current = { width: targetWidth, height: targetHeight };
  };

  const handleResizeTouchMove = (e: React.TouchEvent) => {
    if (!isResizing || e.touches.length !== 1) return;
    performResize(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Bind resize listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, aspectRatio, keepAspect]);

  // Start image drag/pan
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach window event listeners for smooth drag beyond element boundaries
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    offsetStart.current = { ...offset };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    setOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    });
  };

  // Fit image helper (sets center, zoom=1)
  const resetImageFitting = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Rotate helper (cyclic 0, 90, 180, 270)
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Crop & generate output File
  const handleConfirmCrop = () => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    
    // Create virtual canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill dark transparent bg (for contain fallback)
    ctx.fillStyle = '#0f0f11';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Context transform setup
    ctx.save();
    
    // Translate context to center of canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);
    
    // Rotate canvas context
    ctx.rotate((rotation * Math.PI) / 180);

    // Find scaled dimensions
    // We calculate how the image coordinates map relative to our current interactive viewport view
    // On the UI, we scale the image based on its aspect ratio.
    const container = viewportRef.current;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Base rendering dimensions of the image in the container (preserving natural aspect of image)
      const imgNaturalRatio = img.naturalWidth / img.naturalHeight;
      let displayWidth = containerWidth;
      let displayHeight = containerWidth / imgNaturalRatio;

      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgNaturalRatio;
      }

      // Convert offsets and scales to match canvas coordinates
      // UI aspect ratios are mapped to output size. Let's compute scale ratio.
      const scaleX = targetWidth / containerWidth;
      const scaleY = targetHeight / containerHeight;
      const baseScale = Math.max(scaleX, scaleY);
      const scaleMultiplier = baseScale / cropBoxScale; // projection scale adjusted for resizable crop box

      // Apply zoom & position matching the viewport state
      const drawWidth = displayWidth * zoom * scaleMultiplier;
      const drawHeight = displayHeight * zoom * scaleMultiplier;
      
      const drawX = offset.x * scaleMultiplier;
      const drawY = offset.y * scaleMultiplier;

      ctx.drawImage(
        img,
        drawX - drawWidth / 2,
        drawY - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    } else {
      // Fallback: draw normal center
      ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    }

    ctx.restore();

    // Export canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Keep same visual filename or make clean custom extension
          const originalName = file.name;
          const extension = 'png';
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const croppedFile = new File([blob], `${nameWithoutExt}-edited.${extension}`, {
            type: 'image/png',
            lastModified: Date.now(),
          });
          onCropComplete(croppedFile);
        }
      },
      'image/png',
      quality
    );
  };

  // Calculates the correct centered dimensions of the crop box in percentage of the 16:9 viewport
  const getCropBoxStyle = () => {
    const containerW = 1600;
    const containerH = 900;
    
    let maxW = containerW;
    let maxH = containerW / aspectRatio;
    if (maxH > containerH) {
      maxH = containerH;
      maxW = containerH * aspectRatio;
    }
    
    const boxW = maxW * cropBoxScale;
    const boxH = maxH * cropBoxScale;
    
    const widthPercent = (boxW / containerW) * 100;
    const heightPercent = (boxH / containerH) * 100;
    
    return {
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-zinc-950/60">
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-brand-primary" />
              სურათის მორგება და ზომის შეცვლა
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">სტრიმის თამბნეილის ოპტიმიზაცია და ქროპი</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Workspace Frame */}
          <div className="grid md:grid-cols-5 gap-6">
            
            {/* Viewport and Preview Container */}
            <div className="md:col-span-3 space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">მორგება (გადაადგილება, მაუსის სკროლი ან კუთხის მოქაჩვა)</label>
              
              <div 
                ref={viewportRef}
                className="relative aspect-video w-full bg-zinc-950 rounded-2xl overflow-hidden border border-white/5 cursor-move flex items-center justify-center select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                {/* Crop overlay highlight matching selected ratio */}
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Highlight mask area based on aspect ratio and dynamic tracking scale */}
                  <div 
                    className="relative border border-white/40 shadow-[0_0_0_9999px_rgba(15,15,17,0.7)] flex items-center justify-center"
                    style={getCropBoxStyle()}
                  >
                    <div className="absolute top-2 left-2 text-[8px] bg-black/60 border border-white/10 px-2 py-0.5 rounded text-white tracking-widest uppercase font-black">
                      ზომა: {targetWidth}x{targetHeight} ({aspectLabel})
                    </div>
                    {/* Visual guidelines */}
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full opacity-20 pointer-events-none">
                      <div className="border-r border-b border-dashed border-white"></div>
                      <div className="border-r border-b border-dashed border-white"></div>
                      <div className="border-b border-dashed border-white"></div>
                      <div className="border-r border-b border-dashed border-white"></div>
                      <div className="border-r border-b border-dashed border-white"></div>
                      <div className="border-b border-dashed border-white"></div>
                      <div className="border-r border-dashed border-white"></div>
                      <div className="border-r border-dashed border-white"></div>
                      <div></div>
                    </div>

                    {/* INTERACTIVE MOUSE RESIZING GRAB CORNERS OR EDGES */}
                    {/* Top-Left Corner */}
                    <div 
                      className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-brand-primary border-2 border-white rounded-full flex items-center justify-center cursor-nwse-resize pointer-events-auto active:scale-125 hover:scale-110 transition-transform z-30"
                      title="ზომის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'tl')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'tl')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>

                    {/* Top-Right Corner */}
                    <div 
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-brand-primary border-2 border-white rounded-full flex items-center justify-center cursor-nesw-resize pointer-events-auto active:scale-125 hover:scale-110 transition-transform z-30"
                      title="ზომის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'tr')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'tr')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>

                    {/* Bottom-Left Corner */}
                    <div 
                      className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-brand-primary border-2 border-white rounded-full flex items-center justify-center cursor-nesw-resize pointer-events-auto active:scale-125 hover:scale-110 transition-transform z-30"
                      title="ზომის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'bl')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'bl')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>

                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-brand-primary border-2 border-white rounded-full flex items-center justify-center cursor-se-resize pointer-events-auto active:scale-125 hover:scale-110 transition-transform z-30"
                      title="ზომის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'br')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'br')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>

                    {/* Edges */}
                    {/* Top Edge */}
                    <div 
                      className="absolute -top-1.5 left-3 right-3 h-3 bg-brand-primary/10 hover:bg-brand-primary/40 cursor-n-resize pointer-events-auto z-20 transition-all border-t-2 border-dashed border-brand-primary/70"
                      title="სიმაღლის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 't')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 't')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    />

                    {/* Bottom Edge */}
                    <div 
                      className="absolute -bottom-1.5 left-3 right-3 h-3 bg-brand-primary/10 hover:bg-brand-primary/40 cursor-s-resize pointer-events-auto z-20 transition-all border-b-2 border-dashed border-brand-primary/70"
                      title="სიმაღლის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'b')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'b')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    />

                    {/* Left Edge */}
                    <div 
                      className="absolute -left-1.5 top-3 bottom-3 w-3 bg-brand-primary/10 hover:bg-brand-primary/40 cursor-w-resize pointer-events-auto z-20 transition-all border-l-2 border-dashed border-brand-primary/70"
                      title="სიგანის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'l')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'l')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    />

                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-3 bottom-3 w-3 bg-brand-primary/10 hover:bg-brand-primary/40 cursor-e-resize pointer-events-auto z-20 transition-all border-r-2 border-dashed border-brand-primary/70"
                      title="სიგანის შეცვლა"
                      onMouseDown={(e) => handleResizeStart(e, 'r')}
                      onTouchStart={(e) => handleResizeTouchStart(e, 'r')}
                      onTouchMove={handleResizeTouchMove}
                      onTouchEnd={handleResizeEnd}
                    />
                  </div>
                </div>

                {imageSrc && (
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="To Crop"
                    className="max-h-full max-w-full object-contain select-none pointer-events-none"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isDragging || isResizing ? 'none' : 'transform 0.1s ease',
                    }}
                    referrerPolicy="no-referrer"
                    onLoad={() => {
                      // auto initialize best display
                    }}
                  />
                )}

                <div className="absolute bottom-3 right-3 z-20 bg-black/80 backdrop-blur-md text-[8px] font-black px-2.5 py-1 border border-white/5 rounded-xl flex items-center gap-1.5 text-zinc-300">
                  <Move size={10} className="text-brand-primary animate-bounce" />
                  drag-and-drop / მაუსის სკროლი გასადიდებლად
                </div>
              </div>

              {/* Viewport Control Sliders */}
              <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 gap-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">მასშტაბირება / ზუმი: {zoom.toFixed(2)}x</span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-zinc-300 transition-all"
                    >
                      <Minimize2 size={12} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setZoom(Math.min(4, zoom + 0.1))}
                      className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-zinc-300 transition-all"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                </div>
                
                <input 
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary cursor-pointer bg-zinc-800 rounded-lg appearance-none h-1.5"
                />

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={handleRotate}
                    className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl"
                  >
                    <RotateCw size={12} className="text-brand-primary" />
                    შემოტრიალება (90°)
                  </button>

                  <button 
                    type="button"
                    onClick={resetImageFitting}
                    className="text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-300 transition-all"
                  >
                    პოზიციის გასუფთავება
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Setup Configuration */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Preset Ratios */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">ფორმატი (პროპორციები)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAspectChange(16 / 9, '16:9')}
                    className={cn(
                      "p-3 rounded-xl border font-black text-[10px] uppercase transition-all tracking-wider text-center",
                      aspectRatio === 16 / 9 
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                        : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/10"
                    )}
                  >
                    16:9 ლაივისთვის
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAspectChange(4 / 3, '4:3')}
                    className={cn(
                      "p-3 rounded-xl border font-black text-[10px] uppercase transition-all tracking-wider text-center",
                      aspectRatio === 4 / 3 
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                        : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/10"
                    )}
                  >
                    4:3 სპორტი
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAspectChange(1, '1:1')}
                    className={cn(
                      "p-3 rounded-xl border font-black text-[10px] uppercase transition-all tracking-wider text-center",
                      aspectRatio === 1 
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                        : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/10"
                    )}
                  >
                    1:1 კვადრატი
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAspectChange(21 / 9, '21:9')}
                    className={cn(
                      "p-3 rounded-xl border font-black text-[10px] uppercase transition-all tracking-wider text-center",
                      aspectRatio === 21 / 9 
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                        : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/10"
                    )}
                  >
                    21:9 ფართო
                  </button>
                </div>
              </div>

              {/* Target dimensions */}
              <div className="space-y-3 p-4 bg-black/35 border border-white/5 rounded-2xl">
                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">გამომავალი რეზოლუცია</span>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-zinc-600 uppercase block">სიგანე (PX)</span>
                    <input 
                      type="number" 
                      value={targetWidth} 
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[11px] font-mono font-black text-white outline-none focus:border-brand-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-zinc-600 uppercase block">სიმაღლე (PX)</span>
                    <input 
                      type="number" 
                      value={targetHeight} 
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[11px] font-mono font-black text-white outline-none-focus:border-brand-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={keepAspect} 
                      onChange={(e) => setKeepAspect(e.target.checked)} 
                      className="w-4 h-4 rounded accent-brand-primary" 
                    />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">პროპორციის შენარჩუნება</span>
                  </label>
                </div>
              </div>

              {/* Quality compression scale */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 tracking-widest block ml-1">
                  <span>სურათის ხარისხი (კომპრესია)</span>
                  <span className="text-brand-primary">{(quality * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary cursor-pointer bg-zinc-800 rounded-lg appearance-none h-1"
                />
                <p className="text-[8px] text-zinc-600 italic uppercase">ოპტიმალურია 80-90% რათა ფაილი არ ასცდეს 4 MB ლიმიტს.</p>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Buttons Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-[10px] font-black text-zinc-500 uppercase">
            ორიგინალი: {(file.size / (1024 * 1024)).toFixed(2)} MB
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <Check size={12} className="stroke-[3px]" />
              დადასტურება და ატვირთვა
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
