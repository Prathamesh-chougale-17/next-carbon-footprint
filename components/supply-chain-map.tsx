"use client";

import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import { Icon, Style, Stroke, Fill, Text } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';

interface Location {
    lat: number;
    lng: number;
    name: string;
    type: 'Manufacturing' | 'Raw Material' | 'Component' | 'Final Product';
    transport?: 'Road' | 'Sea' | 'Rail' | 'Air';
    carbonFootprint?: number;
    quantity?: number;
    parentLocation?: { lat: number; lng: number }; // Add parent location for connections
}

interface SupplyChainMapProps {
    locations: Location[];
    title?: string;
    height?: number;
    zoom?: number;
    showLines?: boolean;
}

const facilityIcons = {
    Manufacturing: 'https://img.icons8.com/color/48/industrial-building.png',
    'Raw Material': 'https://img.icons8.com/color/48/coal-mine.png',
    Component: 'https://img.icons8.com/color/48/factory.png',
    'Final Product': 'https://img.icons8.com/color/48/package.png',
};

const transportIcons = {
    Road: 'https://img.icons8.com/color/48/truck.png',
    Sea: 'https://img.icons8.com/color/48/cargo-ship.png',
    Rail: 'https://img.icons8.com/color/48/train.png',
    Air: 'https://img.icons8.com/color/48/airplane-take-off.png',
};

export default function SupplyChainMap({
    locations,
    title = "Supply Chain Journey",
    height = 400,
    zoom = 2,
    showLines = true,
}: SupplyChainMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current || locations.length === 0) return undefined;

        const facilitySource = new VectorSource();
        const transportSource = new VectorSource();

        // Add Facility Icons & Names
        locations.forEach((loc) => {
            const facilityFeature = new Feature({
                geometry: new Point(fromLonLat([loc.lng, loc.lat])),
            });

            facilityFeature.setStyle(
                new Style({
                    image: new Icon({
                        src: facilityIcons[loc.type],
                        scale: 0.8,
                        anchor: [0.5, 1],
                    }),
                    text: new Text({
                        text: loc.name,
                        offsetY: -30,
                        font: 'bold 12px Arial',
                        fill: new Fill({ color: '#333' }),
                        stroke: new Stroke({ color: '#fff', width: 4 }),
                    }),
                })
            );

            facilitySource.addFeature(facilityFeature);
        });

        // Add Connecting Lines & Midpoint Transport Icons
        if (showLines && locations.length > 1) {
            locations.forEach((loc) => {
                // If this location has a parent, connect to it
                if (loc.parentLocation) {
                    const start = fromLonLat([loc.parentLocation.lng, loc.parentLocation.lat]);
                    const end = fromLonLat([loc.lng, loc.lat]);

                    // Add connecting lines with different colors based on type
                    const lineFeature = new Feature(new LineString([start, end]));
                    let lineColor = '#888';
                    let lineWidth = 2.5;

                    // Different colors for different component types
                    switch (loc.type) {
                        case 'Raw Material':
                            lineColor = '#10b981'; // emerald
                            lineWidth = 3;
                            break;
                        case 'Component':
                            lineColor = '#3b82f6'; // blue
                            lineWidth = 2.5;
                            break;
                        case 'Final Product':
                            lineColor = '#6366f1'; // indigo
                            lineWidth = 4;
                            break;
                        default:
                            lineColor = '#6b7280'; // gray
                            break;
                    }

                    lineFeature.setStyle(
                        new Style({
                            stroke: new Stroke({
                                color: lineColor,
                                width: lineWidth,
                                lineDash: [10, 8],
                            }),
                        })
                    );
                    transportSource.addFeature(lineFeature);

                    // Add midpoint transport icons
                    const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
                    const transportFeature = new Feature(new Point(midpoint));
                    transportFeature.setStyle(
                        new Style({
                            image: new Icon({
                                src: transportIcons[loc.transport || 'Road'],
                                scale: 0.7,
                                anchor: [0.5, 0.5],
                            }),
                            text: new Text({
                                text: loc.transport || 'Road',
                                offsetY: 25,
                                font: 'bold 11px Arial',
                                fill: new Fill({ color: '#000' }),
                                stroke: new Stroke({ color: '#fff', width: 3 }),
                            }),
                        })
                    );
                    transportSource.addFeature(transportFeature);
                }
            });
        }

        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({ source: transportSource }), // Lines & Transport Icons
                new VectorLayer({ source: facilitySource }), // Facility Icons (on top)
            ],
            view: new View({
                center: fromLonLat([locations[0].lng, locations[0].lat]),
                zoom,
            }),
        });

        return () => map.setTarget(undefined);
    }, [locations, zoom, showLines]);

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div ref={mapRef} style={{ height, width: '100%' }} />
        </div>
    );
}
