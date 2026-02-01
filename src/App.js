import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [hexColor, setHexColor] = useState('#000000');
  const [matches, setMatches] = useState([]);
  const [pickerPosition, setPickerPosition] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedColor, setLockedColor] = useState(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);

  // Load Polychromo colors
  const [polychromo, setPolychromos] = useState([]);

  useEffect(() => {
    fetch('/polychromo.json')
      .then(res => res.json())
      .then(data => setPolychromos(data));
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
    setLockedColor(null);
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
    if (!ctxRef.current || !image || !canvasRef.current) return;

    // **FREEZE ON LMB CLICK**
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvasRef.current.width - 1));
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvasRef.current.height - 1));

    const pixel = ctxRef.current.getImageData(x, y, 1, 1).data;
    const r = pixel[0], g = pixel[1], b = pixel[2];

    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    // Lock this exact color and position
    setIsLocked(true);
    setLockedColor({ r, g, b, hex });
    setPickerPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    // Update matches for locked color
    const topMatches = findBestMatches({ r, g, b }, polychromo);
    setMatches(topMatches);
  }, [polychromo, image]);

  const handleMouseMove = useCallback((e) => {
    if (!ctxRef.current || !image || !canvasRef.current) return;

    if (isLocked) {
      // When locked, picker stays frozen, cursor moves freely
      return;
    }

    // Normal picking mode
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
  }, [polychromo, image, isLocked]);

  const unlockColor = () => {
    setIsLocked(false);
    setLockedColor(null);
  };

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

  return (
    <div className="App">
      <h1>Hue Hunter</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: '20px' }}
      />

      {image && (
        <>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              style={{ 
                border: '2px solid #333', 
                maxWidth: '100%', 
                maxHeight: '800px',
                cursor: isLocked ? 'default' : 'crosshair',
                display: 'block'
              }}
            />
            {pickerPosition && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pickerPosition.x}px`,
                  top: `${pickerPosition.y}px`,
                  width: 30,
                  height: 30,
                  border: isLocked ? '4px solid gold' : '3px solid white',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 3px #333',
                  backgroundColor: hexColor,
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}
              />
            )}
          </div>

          <div style={{ margin: '20px 0' }}>
            {isLocked && (
              <button 
                onClick={unlockColor}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 10
                }}
              >
                🔓 Unlock (Click to pick new color)
              </button>
            )}
            <div
              style={{
                backgroundColor: hexColor,
                width: 100,
                height: 60,
                border: isLocked ? '3px solid gold' : '2px solid #333',
                margin: '0 auto 10px',
                borderRadius: 8,
                display: 'inline-block'
              }}
            />
            <h3>{hexColor} {isLocked && '(LOCKED)'}</h3>
          </div>

          <div>
            <h3>Top 10 Polychromo Matches:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {matches.map((match, i) => (
                <div key={i} style={{ border: '1px solid #ccc', padding: 10, borderRadius: 4 }}>
                  <div
                    style={{
                      backgroundColor: match.hex,
                      width: '100%',
                      height: 40,
                      borderRadius: 4,
                      marginBottom: 5
                    }}
                  />
                  <strong>{match.name}</strong>
                  <div>#{match.number}</div>
                  <div>Family: {match.family}</div>
                  <div>Dist: {match.distance.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
