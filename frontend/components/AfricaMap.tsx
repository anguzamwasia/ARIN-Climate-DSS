"use client"

import React, { useState } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"

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

  return (
    <div className="w-full h-[500px] bg-secondary/10 rounded-xl border border-border relative overflow-hidden flex flex-col items-center justify-center">
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xl pointer-events-none z-10 transition-opacity">
          {tooltipContent}
        </div>
      )}
      
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
        <ZoomableGroup center={[20, 2]} zoom={1.3} minZoom={1} maxZoom={5}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies
                .filter(geo => AFRICAN_COUNTRIES.includes(geo.properties.name))
                .map((geo) => {
                  const countryName = geo.properties.name
                // If the dataset uses slightly different names, map them if needed. Usually geo.properties.name is standard.
                const count = countryCounts[countryName] || 0
                const isSelected = selectedCountry === countryName
                
                // Color logic: Empty = Light Gray, Has Data = Vibrant Green (Accent), Selected = Dark Green (Primary)
                let fill = "#EAEAEA"
                if (count > 0) fill = "#10B981" // Tailwind Emerald-500 (Matches the green accent vibe)
                if (isSelected) fill = "#047857" // Tailwind Emerald-700
                
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
                      hover: { fill: count > 0 ? "#34D399" : "#D4D4D4", outline: "none", cursor: count > 0 ? "pointer" : "default" },
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

export default AfricaMap
