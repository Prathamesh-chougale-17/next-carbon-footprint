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
            locations.forEach((_loc, i) => {
                if (i === locations.length - 1) return;

                const start = fromLonLat([locations[i].lng, locations[i].lat]);
                const end = fromLonLat([locations[i + 1].lng, locations[i + 1].lat]);

                // Add connecting lines
                const lineFeature = new Feature(new LineString([start, end]));
                lineFeature.setStyle(
                    new Style({
                        stroke: new Stroke({
                            color: '#888',
                            width: 2.5,
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
                            src: transportIcons[locations[i + 1].transport || 'Road'],
                            scale: 0.7,
                            anchor: [0.5, 0.5],
                        }),
                        text: new Text({
                            text: locations[i + 1].transport,
                            offsetY: 25,
                            font: 'bold 11px Arial',
                            fill: new Fill({ color: '#000' }),
                            stroke: new Stroke({ color: '#fff', width: 3 }),
                        }),
                    })
                );
                transportSource.addFeature(transportFeature);
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
