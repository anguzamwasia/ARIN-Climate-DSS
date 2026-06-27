"use client"

import React, { useState, useMemo } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleLinear } from "d3-scale"

const geoUrl = "/world-countries.json"

interface AfricaMapProps {
  countryCounts: Record<string, number>
  selectedCountry: string | null
  onSelectCountry: (country: string | null) => void
}

// Comprehensive list of African countries (matching world-110m names)
const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Rep.", "Chad", "Comoros", "Congo", "Dem. Rep. Congo", "Djibouti", "Egypt", "Eq. Guinea", "Eritrea", "eSwatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Côte d'Ivoire", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "S. Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "W. Sahara", "Somaliland"
]

const AfricaMap = ({ countryCounts, selectedCountry, onSelectCountry }: AfricaMapProps) => {
  const [tooltipContent, setTooltipContent] = useState("")
  const [position, setPosition] = useState({ coordinates: [20, 2] as [number, number], zoom: 1.3 })

  const handleZoomIn = () => {
    if (position.zoom >= 5) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 }));
  };


  const maxCount = useMemo(() => {
    const counts = Object.values(countryCounts)
    return counts.length > 0 ? Math.max(...counts) : 1
  }, [countryCounts])

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount * 0.25, maxCount * 0.5, maxCount * 0.75, maxCount])
    .range(["#f8fafc", "#99f6e4", "#14b8a6", "#0f766e", "#042f2e"])


  return (
    <div className="w-full h-[500px] bg-secondary/10 rounded-xl border border-border relative overflow-hidden flex flex-col items-center justify-center">
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xl pointer-events-none z-10 transition-opacity">
          {tooltipContent}
        </div>
      )}
      
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 flex flex-col z-10 bg-white rounded-lg shadow-md border border-border overflow-hidden">
        <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-bold border-b border-border transition-colors text-lg">+</button>
        <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-bold transition-colors text-lg">-</button>
      </div>

      {/* We use a Mercator projection centered directly on the African continent */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 400,
        }}
        width={800}
        height={600}
        style={{ width: "100%", height: "100%", outline: "none" }}
      >
        <ZoomableGroup 
          center={position.coordinates} 
          zoom={position.zoom} 
          minZoom={1} 
          maxZoom={5}
          onMoveEnd={(pos) => setPosition(pos as { coordinates: [number, number]; zoom: number })}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies
                .filter(geo => AFRICAN_COUNTRIES.includes(geo.properties.name))
                .map((geo) => {
                  const countryName = geo.properties.name
                // If the dataset uses slightly different names, map them if needed. Usually geo.properties.name is standard.
                const count = countryCounts[countryName] || 0
                const isSelected = selectedCountry === countryName
                
                // Color logic: Empty = Light Gray, Has Data = Scaled Teal, Selected = Amber Highlight
                let fill = "#f1f5f9"
                if (count > 0) fill = colorScale(count)
                if (isSelected) fill = "#f59e0b" // Amber highlight for selection
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (count > 0) {
                        onSelectCountry(isSelected ? null : countryName)
                      }
                    }}
                    onMouseEnter={() => {
                      if (count > 0) {
                        setTooltipContent(`${countryName}: ${count} Report${count > 1 ? 's' : ''}`)
                      } else {
                        setTooltipContent(countryName)
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("")
                    }}
                    style={{
                      default: { fill, outline: "none", stroke: "#FFFFFF", strokeWidth: 0.5 },
                      hover: { fill: count > 0 ? "#14b8a6" : "#D4D4D4", outline: "none", cursor: count > 0 ? "pointer" : "default" },
                      pressed: { fill: "#0f766e", outline: "none" },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}

export default AfricaMap
