"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { scaleLinear } from "d3-scale"
import type { FeatureCollection } from 'geojson'

interface KenyaMapProps {
  countyCounts: Record<string, number>
  selectedCounty: string | null
  onSelectCounty: (county: string) => void
}

export default function KenyaMapClient({ countyCounts, selectedCounty, onSelectCounty }: KenyaMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    fetch('/kenya-counties.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading GeoJSON", err))
  }, [])

  const maxCount = useMemo(() => {
    const counts = Object.values(countyCounts)
    return counts.length > 0 ? Math.max(...counts) : 1
  }, [countyCounts])

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount * 0.25, maxCount * 0.5, maxCount * 0.75, maxCount])
    .range(["#f1f5f9", "#bfdbfe", "#60a5fa", "#2563eb", "#021d49"])

  if (!geoData) return null

  return (
    <div className="w-full h-[600px] border border-border rounded-xl overflow-hidden relative shadow-sm z-0" style={{ background: '#F8FAFC' }}>
      <MapContainer 
        bounds={[[-4.7, 33.9], [5.4, 41.9]]} // Kenya's boundaries [ [South, West], [North, East] ]
        zoomControl={true}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0, background: 'transparent' }}
      >
        <GeoJSON
          data={geoData}
          style={(feature) => {
            const rawName = feature?.properties?.shapeName
            const countyName = `${rawName} County`
            const count = countyCounts[countyName] || 0
            const isSelected = selectedCounty === countyName

            return {
              fillColor: count > 0 ? colorScale(count) : "#f1f5f9",
              weight: isSelected ? 2.5 : 1,
              opacity: 1,
              color: isSelected ? "#021d49" : "#94a3b8", // Stroke color
              fillOpacity: count > 0 ? 0.8 : 0.4,
            }
          }}
          onEachFeature={(feature, layer) => {
            const rawName = feature.properties.shapeName
            const countyName = `${rawName} County`
            
            layer.on({
              click: () => {
                if (selectedCounty === countyName) {
                  onSelectCounty("")
                } else {
                  onSelectCounty(countyName)
                }
              },
              mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({
                  weight: 2,
                  color: '#021d49',
                  fillOpacity: 0.9
                });
                l.bringToFront();
              },
              mouseout: (e: any) => {
                const l = e.target;
                const isSelected = selectedCounty === countyName
                const count = countyCounts[countyName] || 0
                l.setStyle({
                  weight: isSelected ? 2.5 : 1,
                  color: isSelected ? "#021d49" : "#94a3b8",
                  fillOpacity: count > 0 ? 0.8 : 0.4,
                });
                if (!isSelected) {
                    l.bringToBack();
                }
              }
            })
          }}
        />
      </MapContainer>
      
      {/* Legend / Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-border text-sm pointer-events-none" style={{ zIndex: 1000 }}>
        <h4 className="font-semibold text-foreground mb-2">Reports Density</h4>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">0</span>
          <div className="w-32 h-3 rounded-full bg-gradient-to-r from-white to-[#021d49] border border-slate-200"></div>
          <span className="font-medium">{maxCount}+</span>
        </div>
        {selectedCounty && (
          <div className="mt-3 pt-3 border-t border-slate-200 font-medium text-accent">
            Selected: {selectedCounty} ({countyCounts[selectedCounty] || 0} reports)
          </div>
        )}
      </div>
    </div>
  )
}
