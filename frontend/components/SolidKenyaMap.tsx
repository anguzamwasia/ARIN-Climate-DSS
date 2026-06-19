"use client"

import React, { useState, memo } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"

const geoUrl = "/kenya-counties.geojson"

interface KenyaMapProps {
  countyCounts: Record<string, number>
  selectedCounty: string | null
  onSelectCounty: (county: string | null) => void
}

const SolidKenyaMap = ({ countyCounts, selectedCounty, onSelectCounty }: KenyaMapProps) => {
  const [tooltipContent, setTooltipContent] = useState("")

  const maxCount = Math.max(1, ...Object.values(countyCounts));
  
  const getColor = (count: number, isSelected: boolean) => {
    if (isSelected) return "#064E3B"; // Darkest green
    if (count === 0) return "#E2E8F0"; // Slate 200 (visible grey)
    const ratio = count / maxCount;
    if (ratio > 0.7) return "#059669"; // Emerald 600
    if (ratio > 0.4) return "#10B981"; // Emerald 500
    if (ratio > 0.2) return "#34D399"; // Emerald 400
    return "#6EE7B7"; // Emerald 300
  };

  return (
    <div className="w-full h-[600px] bg-secondary/10 rounded-xl border border-border relative overflow-hidden flex flex-col items-center justify-center">
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xl pointer-events-none z-10 transition-opacity">
          {tooltipContent}
        </div>
      )}
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [38.0, 0.5], scale: 3200 }}
        width={800}
        height={600}
        style={{ width: "100%", height: "100%", outline: "none" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={5}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rawName = geo.properties.shapeName || geo.properties.name || ""
                const name = rawName.includes("County") ? rawName : `${rawName} County`
                const count = countyCounts[name] || 0
                const isSelected = selectedCounty === name
                
                const fill = getColor(count, isSelected)
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (count > 0) onSelectCounty(isSelected ? null : name)
                    }}
                    onMouseEnter={() => {
                      if (count > 0) {
                        setTooltipContent(`${name}: ${count} Report${count > 1 ? 's' : ''}`)
                      } else {
                        setTooltipContent(name)
                      }
                    }}
                    onMouseLeave={() => setTooltipContent("")}
                    style={{
                      default: { fill, outline: "none", stroke: "#94A3B8", strokeWidth: 0.8 },
                      hover: { fill: count > 0 ? "#10B981" : "#CBD5E1", outline: "none", cursor: count > 0 ? "pointer" : "default" },
                      pressed: { fill: "#047857", outline: "none" },
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

export default memo(SolidKenyaMap)
