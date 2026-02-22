import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppHtml from './AppHtml.jsx';
import './App.css';

// Utility functions moved outside component (fixes ESLint warnings)
const findBestMatches = (picked, colors) => {
  return colors
    .map(color => ({
      ...color,
      rgb: hexToRgb(color.hex),
      distance: colorDistance(picked, hexToRgb(color.hex))
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);
};

const colorDistance = (c1, c2) => {
  const r = (c1.r - c2.r) ** 2;
  const g = (c1.g - c2.g) ** 2;
  const b = (c1.b - c2.b) ** 2;
  return Math.sqrt(r + g + b);
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

function App() {
  const [image, setImage] = useState(null);
  const [hexColor, setHexColor] = useState('#000000');
  const [matches, setMatches] = useState([]);
  const [pickerPosition, setPickerPosition] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  // Removed unused lockedColor state
  const [lockedMatches, setLockedMatches] = useState([]);
  const [polychromo, setPolychromos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);

  const handleContextMenu = useCallback((e) => {
  e.preventDefault(); // Prevents default right-click menu
  unlockColor();
}, []);

// Add this useEffect to attach the right-click handler
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  canvas.addEventListener('contextmenu', handleContextMenu);
  return () => {
    canvas.removeEventListener('contextmenu', handleContextMenu);
  };
}, [handleContextMenu]);

  // Load polychromo colors with error handling
  useEffect(() => {
    fetch('/polychromo.json')
      .then(res => res.json())
      .then(data => {
        setPolychromos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load colors:', err);
        setLoading(false);
      });
  }, []);

  const drawImage = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const maxWidth = 1000;
    const maxHeight = 800;
    const imgRatio = image.naturalWidth / image.naturalHeight;
    
    let width = image.naturalWidth;
    let height = image.naturalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / imgRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * imgRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(image, 0, 0, width, height);
    ctxRef.current = ctx;
    
    setMatches([]);
    setPickerPosition(null);
    setHexColor('#000000');
    setIsLocked(false);
    setLockedMatches([]);
  }, [image]);

  useEffect(() => {
    drawImage();
  }, [image, drawImage]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!ctxRef.current || !image || !canvasRef.current || isLocked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvasRef.current.width - 1));
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvasRef.current.height - 1));

    const pixel = ctxRef.current.getImageData(x, y, 1, 1).data;
    const r = pixel[0], g = pixel[1], b = pixel[2];

    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    setIsLocked(true);
    setPickerPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const topMatches = findBestMatches({ r, g, b }, polychromo);
    setLockedMatches(topMatches);
    setMatches(topMatches);
  }, [polychromo, image, isLocked, findBestMatches]);

  const handleMouseMove = useCallback((e) => {
    if (!ctxRef.current || !image || !canvasRef.current || isLocked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvasRef.current.width - 1));
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvasRef.current.height - 1));

    const pixel = ctxRef.current.getImageData(x, y, 1, 1).data;
    const r = pixel[0], g = pixel[1], b = pixel[2];

    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    setHexColor(hex);

    setPickerPosition({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });

    const topMatches = findBestMatches({ r, g, b }, polychromo);
    setMatches(topMatches);
  }, [polychromo, image, isLocked, findBestMatches]);

  const unlockColor = () => {
    setIsLocked(false);
    setLockedMatches([]);
  };

  const appProps = {
    image,
    hexColor,
    matches,
    pickerPosition,
    isLocked,
    lockedMatches,
    canvasRef,
    handleImageUpload,
    handleMouseDown,
    handleMouseMove,
    handleContextMenu,
    unlockColor,
    loading
  };

  return <AppHtml {...appProps} />;
}

export default App;
