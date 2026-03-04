'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface ClienteLocation {
    id: string;
    name: string;
    position: [number, number];
    radius: number;
    clientes: number;
}

interface ClientesMapProps {
    data: ClienteLocation[];
}

export default function ClientesMap({ data }: ClientesMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Fix for Leaflet icons mismatch in NextJS, though we are using CircleMarker which doesn't need external img.
    }, []);

    if (!mounted) {
        return (
            <Card className="rounded-none border-slate-200 shadow-sm h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-slate-900" />
                        Mapa de Calor (Clientes)
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center bg-slate-50 min-h-[300px]">
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Carregando Mapa...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-50 shrink-0 bg-slate-50/50">
                <CardTitle className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-900" />
                    Distribuição Geográfica
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-[400px]">
                {/* 
                  Using MapBox or standard OSM tiles. 
                  Standard OSM for open open-source, light aesthetic.
                  We position it absolute to fill the container.
                */}
                <div className="absolute inset-0">
                    <MapContainer
                        center={[-15.77972, -47.92972]} // Center roughly on Brazil
                        zoom={4}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                        className="bg-slate-100"
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />

                        {data.map((loc) => (
                            <CircleMarker
                                key={loc.id}
                                center={loc.position}
                                radius={loc.radius}
                                pathOptions={{
                                    fillColor: '#0f172a', // slate-900 Core theme 
                                    color: '#f8fafc', // slate-50 border
                                    weight: 1.5,
                                    fillOpacity: 0.7
                                }}
                            >
                                <Tooltip direction="top" offset={[0, -10]} opacity={1} className="!p-0 !border-0 !rounded-none shadow-xl">
                                    <div className="bg-white border-2 border-slate-900 p-3 min-w-[140px]">
                                        <p className="font-bold text-slate-800 text-sm mb-1">{loc.name}</p>
                                        <p className="text-sm font-medium text-slate-600">
                                            <span className="text-slate-900 font-bold">{loc.clientes}</span> ativos
                                        </p>
                                    </div>
                                </Tooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
            </CardContent>
        </Card>
    );
}
