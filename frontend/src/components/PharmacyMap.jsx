import { useEffect } from 'react';
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitMapBounds({ center, pharmacies }) {
    const map = useMap();

    useEffect(() => {
        const points = [
            [center.lat, center.lng],
            ...pharmacies
                .filter(
                    (p) =>
                        Number.isFinite(Number(p.latitude)) &&
                        Number.isFinite(Number(p.longitude))
                )
                .map((p) => [
                    Number(p.latitude),
                    Number(p.longitude),
                ]),
        ];

        if (points.length > 1) {
            map.fitBounds(points, {
                padding: [35, 35],
                maxZoom: 14,
            });
        } else {
            map.setView([center.lat, center.lng], 13);
        }
    }, [map, center.lat, center.lng, pharmacies]);

    return null;
}

export default function PharmacyMap({
    center,
    pharmacies = [],
}) {
    const validPharmacies = pharmacies.filter(
        (p) =>
            Number.isFinite(Number(p.latitude)) &&
            Number.isFinite(Number(p.longitude))
    );

    return (
        <div className="rounded-2xl border p-4">
            <h2 className="mb-3 text-lg font-bold">
                Nearby Pharmacy Map
            </h2>

            <MapContainer
                center={[center.lat, center.lng]}
                zoom={13}
                scrollWheelZoom={true}
                style={{
                    height: '420px',
                    width: '100%',
                    borderRadius: '12px',
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitMapBounds
                    center={center}
                    pharmacies={validPharmacies}
                />

                <CircleMarker
                    center={[center.lat, center.lng]}
                    radius={9}
                    pathOptions={{
                        color: '#ffffff',
                        fillColor: '#06b6d4',
                        fillOpacity: 1,
                        weight: 3,
                    }}
                >
                    <Popup>Your selected location</Popup>
                </CircleMarker>

                {validPharmacies.map((p, index) => (
                    <CircleMarker
                        key={p.id ?? index}
                        center={[
                            Number(p.latitude),
                            Number(p.longitude),
                        ]}
                        radius={8}
                        pathOptions={{
                            color: '#ffffff',
                            fillColor: '#16a34a',
                            fillOpacity: 1,
                            weight: 2,
                        }}
                    >

                        <Popup>
                            <strong>{p.name}</strong>
                            <br />
                            {p.addressLine}, {p.city}
                            <br />
                            Distance: {p.distanceKm ?? 'N/A'} km
                            <br />

                            <a
                                href={`https://www.google.com/maps/dir/?api=1&origin=${center.lat},${center.lng}&destination=${Number(p.latitude)},${Number(p.longitude)}&travelmode=driving`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block',
                                    marginTop: '8px',
                                    color: '#0284c7',
                                    fontWeight: 'bold',
                                }}
                            >
                                Get Directions →
                            </a>

                        </Popup>

                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
