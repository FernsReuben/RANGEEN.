// AppHtml.jsx
import React from 'react';

function AppHtml({
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
  handleContextMenu,  // ← Added this prop
  unlockColor,
  loading
}) {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Polychromo Color Picker</h1>
        <p>Upload an image, hover to explore its colors, and find Polychromo matches.</p>
      </header>

      <section className="upload-section">
        <label className="upload-button">
          Choose an image
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>
      </section>

      {loading && <div className="loading">Loading color data…</div>}

      <section className="canvas-section">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onContextMenu={handleContextMenu}
            style={{ cursor: isLocked ? 'default' : 'crosshair' }}
          />
          {pickerPosition && (
            <div
              className={`picker-indicator ${isLocked ? 'locked' : ''}`}
              style={{ left: pickerPosition.x, top: pickerPosition.y }}
            />
          )}
        </div>
      </section>

      {isLocked && (
        <button className="unlock-btn" onClick={unlockColor}>
          Unlock Color
        </button>
      )}

      <section className="info-section">
        <div className="color-preview" style={{ backgroundColor: hexColor }} />
        <p className="hex-value">{hexColor}</p>

        <div className="matches">
          <h2>Closest Matches</h2>
          <div className="match-grid">
            {(isLocked ? lockedMatches : matches).map(match => (
              <div key={match.name} className="match-card">
                <div
                  className="match-swatch"
                  style={{ backgroundColor: match.hex }}
                />
                <div className="match-name">{match.name}</div>
                <div className="match-hex">{match.hex}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AppHtml;
