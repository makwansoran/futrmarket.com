import React, { useEffect, useRef, useState } from 'react';

const ConflictMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedConflict, setSelectedConflict] = useState(null);

  const conflicts = [
    {
      name: "Ukraine",
      coords: [49.0, 32.0],
      type: "Interstate War",
      severity: "critical",
      casualties: "200,000-285,000 (2025 est.)",
      description: "Russian invasion ongoing since February 2022. Deadliest current conflict."
    },
    {
      name: "Gaza & Israel-Palestine",
      coords: [31.5, 34.45],
      type: "Interstate Conflict",
      severity: "critical",
      casualties: "21,417 (Aug 2024-Aug 2025)",
      description: "Escalated conflict since October 2023, catastrophic humanitarian situation."
    },
    {
      name: "Sudan",
      coords: [15.5, 32.5],
      type: "Civil War",
      severity: "critical",
      casualties: "20,373 (Aug 2024-Aug 2025)",
      description: "War between SAF and RSF. Over 12 million displaced, famine conditions."
    },
    {
      name: "Myanmar",
      coords: [21.9, 96.0],
      type: "Civil War",
      severity: "high",
      casualties: "15,420 (2024-25 est.)",
      description: "World's longest civil war. Military coup in 2021 reignited violence."
    },
    {
      name: "Syria",
      coords: [35.0, 38.0],
      type: "Civil War",
      severity: "high",
      casualties: "Ongoing",
      description: "Assad regime ousted Dec 2024. Israeli incursions, continued instability."
    },
    {
      name: "Yemen",
      coords: [15.5, 48.0],
      type: "Civil War",
      severity: "high",
      casualties: "Ongoing",
      description: "Regional conflict involving multiple factions and international actors."
    },
    {
      name: "Ethiopia",
      coords: [9.0, 40.0],
      type: "Civil War",
      severity: "medium",
      casualties: "Ongoing",
      description: "Tigray conflict, Fano insurgency in Amhara region."
    },
    {
      name: "Somalia",
      coords: [5.5, 46.0],
      type: "Insurgency",
      severity: "medium",
      casualties: "Ongoing",
      description: "Al-Shabaab insurgency, Mogadishu-Jubaland tensions."
    },
    {
      name: "Afghanistan",
      coords: [33.9, 67.7],
      type: "Insurgency",
      severity: "medium",
      casualties: "768 (2024 est.)",
      description: "Taliban vs ISIL-K and other factions since 2021 US withdrawal."
    },
    {
      name: "Lebanon",
      coords: [33.85, 35.85],
      type: "Cross-border Conflict",
      severity: "medium",
      casualties: "Thousands (2024)",
      description: "Israel-Hezbollah conflict, ceasefire Nov 2024 but strikes continue."
    },
    {
      name: "DRC (East)",
      coords: [-2.0, 28.5],
      type: "Civil War",
      severity: "high",
      casualties: "Ongoing",
      description: "M23 rebellion, regional armed groups, proxy warfare."
    },
    {
      name: "Sahel Region",
      coords: [15.0, 0.0],
      type: "Insurgency",
      severity: "high",
      casualties: "Ongoing",
      description: "Jihadist groups in Mali, Burkina Faso, Niger."
    },
    {
      name: "Nigeria",
      coords: [9.0, 8.0],
      type: "Insurgency",
      severity: "medium",
      casualties: "Ongoing",
      description: "Boko Haram, ISWAP, communal violence, separatist tensions."
    },
    {
      name: "Central African Republic",
      coords: [6.6, 20.9],
      type: "Civil War",
      severity: "medium",
      casualties: "Ongoing",
      description: "Multiple armed groups, Russian mercenary presence."
    },
    {
      name: "Colombia",
      coords: [4.5, -74.0],
      type: "Insurgency",
      severity: "medium",
      casualties: "Ongoing",
      description: "ELN, FARC dissidents, Gulf Clan despite peace negotiations."
    },
    {
      name: "Mexico",
      coords: [23.0, -102.0],
      type: "Criminal Violence",
      severity: "high",
      casualties: "High (gang conflicts)",
      description: "Cartel warfare, 18% increase in lethality of gang clashes."
    },
    {
      name: "Haiti",
      coords: [18.9, -72.3],
      type: "Gang Violence",
      severity: "high",
      casualties: "Ongoing",
      description: "Gang control of territory, humanitarian crisis."
    },
    {
      name: "Pakistan",
      coords: [30.0, 70.0],
      type: "Insurgency",
      severity: "medium",
      casualties: "Ongoing",
      description: "TTP and separatist violence in Khyber Pakhtunkhwa and Balochistan."
    },
    {
      name: "Iraq",
      coords: [33.0, 44.0],
      type: "Insurgency",
      severity: "low",
      casualties: "Low level",
      description: "Residual ISIS activity, militia tensions."
    },
    {
      name: "Azerbaijan-Armenia",
      coords: [40.1, 47.5],
      type: "Territorial Dispute",
      severity: "low",
      casualties: "Sporadic",
      description: "Post-Nagorno-Karabakh tensions continue."
    }
  ];

  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L && mapRef.current) {
      initMap();
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(link);

    // Add custom styles for glass effect on zoom controls
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-control-zoom {
        border: none !important;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
      }
      .leaflet-control-zoom a {
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        color: black !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        transition: all 0.3s ease !important;
      }
      .leaflet-control-zoom a:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      .leaflet-control-zoom a:first-child {
        border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
    `;
    document.head.appendChild(style);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.onload = () => {
      if (mapRef.current) {
        initMap();
      }
    };
    document.body.appendChild(script);

    return () => {
      if (link.parentNode) document.head.removeChild(link);
      if (style.parentNode) document.head.removeChild(style);
      if (script.parentNode) document.body.removeChild(script);
      if (map) {
        map.remove();
      }
    };
  }, []);

  const initMap = () => {
    if (!window.L || !mapRef.current || mapRef.current.innerHTML !== '') return;

    const mapInstance = window.L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([20, 0], 2);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    // Add markers for each conflict
    conflicts.forEach(conflict => {
      const color = conflict.severity === 'critical' ? '#dc2626' : 
                    conflict.severity === 'high' ? '#ea580c' : 
                    conflict.severity === 'medium' ? '#f59e0b' : '#84cc16';

      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          cursor: pointer;
        "></div>
      `;

      const icon = window.L.divIcon({
        html: markerHtml,
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = window.L.marker(conflict.coords, { icon }).addTo(mapInstance);
      
      marker.on('click', () => {
        setSelectedConflict(conflict);
      });

      // Tooltip on hover
      marker.bindTooltip(conflict.name, {
        permanent: false,
        direction: 'top'
      });
    });

    setMap(mapInstance);
  };

  return (
    <div className="w-full h-[340px] flex flex-col bg-gray-900 rounded-lg overflow-hidden relative">
      <div className="flex-1 flex relative">
        <div 
          ref={mapRef} 
          className="flex-1 w-full"
          style={{ minHeight: '300px', height: '100%' }}
        />

        {selectedConflict && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 text-white p-6 overflow-y-auto shadow-2xl z-50">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedConflict.name}</h2>
              <button 
                onClick={() => setSelectedConflict(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Conflict Type</span>
                <p className="font-semibold">{selectedConflict.type}</p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Severity Level</span>
                <p className="font-semibold capitalize">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    selectedConflict.severity === 'critical' ? 'bg-red-600' :
                    selectedConflict.severity === 'high' ? 'bg-orange-600' :
                    selectedConflict.severity === 'medium' ? 'bg-amber-500' : 'bg-lime-500'
                  }`}></span>
                  {selectedConflict.severity}
                </p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Casualties</span>
                <p className="font-semibold">{selectedConflict.casualties}</p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Description</span>
                <p className="text-sm text-gray-300 mt-1">{selectedConflict.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }} className="text-white p-4 flex items-center justify-between border-t border-white/10">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-md"></div>
            <span className="drop-shadow">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600 shadow-md"></div>
            <span className="drop-shadow">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-md"></div>
            <span className="drop-shadow">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500 shadow-md"></div>
            <span className="drop-shadow">Low</span>
          </div>
        </div>
        <div className="text-xs text-white/90 drop-shadow">
          Data sources: ACLED, Crisis Group, CFR | Updated Dec 2025
        </div>
      </div>
    </div>
  );
};

export default ConflictMap;

