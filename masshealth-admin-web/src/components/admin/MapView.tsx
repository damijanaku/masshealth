import { useEffect, useRef, useState } from 'react';
import { MapPin, Users, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';
import Card, { CardHeader, CardTitle } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { MQTTLocationMessage } from '@/types';

interface MapViewProps {
  locations: Map<string, MQTTLocationMessage>;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}

const MapView = ({
  locations,
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Convert Map to array for rendering
  const locationsList = Array.from(locations.values());

  // Calculate center from locations
  const center = locationsList.length > 0
    ? {
        lat: locationsList.reduce((sum, loc) => sum + loc.latitude, 0) / locationsList.length,
        lng: locationsList.reduce((sum, loc) => sum + loc.longitude, 0) / locationsList.length,
      }
    : { lat: 46.0569, lng: 14.5058 }; // Default to Ljubljana

  return (
    <Card
      className={clsx(
        'relative overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50',
        className
      )}
      padding="none"
    >
      {/* Header */}
      <div className="p-4 border-b border-surface-100">
        <CardHeader className="mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <CardTitle>Live User Locations</CardTitle>
              <p className="text-sm text-surface-500">
                {locationsList.length} active users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {onToggleFullscreen && (
              <Button variant="ghost" size="sm" onClick={onToggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </div>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className={clsx(
          'bg-surface-100 relative',
          isFullscreen ? 'h-[calc(100%-5rem)]' : 'h-96'
        )}
      >
        {/* Placeholder map visualization */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-100 to-surface-200">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Map markers visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            {locationsList.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-200 flex items-center justify-center">
                  <Users className="w-8 h-8 text-surface-400" />
                </div>
                <p className="text-surface-500 font-medium">No active users</p>
                <p className="text-surface-400 text-sm">
                  Waiting for location updates...
                </p>
              </div>
            ) : (
              <div className="relative w-full h-full p-8">
                {/* Render user markers */}
                {locationsList.map((location, index) => {
                  // Calculate position relative to container
                  const normalizedLat = ((location.latitude - center.lat) / 0.1) * 100 + 50;
                  const normalizedLng = ((location.longitude - center.lng) / 0.1) * 100 + 50;

                  return (
                    <div
                      key={location.senderId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{
                        left: `${Math.max(10, Math.min(90, normalizedLng))}%`,
                        top: `${Math.max(10, Math.min(90, normalizedLat))}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      {/* Pulse effect */}
                      <div className="absolute inset-0 -m-2 w-8 h-8 bg-primary-400 rounded-full animate-ping opacity-30" />
                      
                      {/* Marker */}
                      <div className="relative w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-150 transition-transform">
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="font-medium">{location.senderName}</div>
                          <div className="text-surface-400">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-surface-900 rotate-45" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map attribution placeholder */}
          <div className="absolute bottom-2 right-2 text-xs text-surface-400 bg-white/80 px-2 py-1 rounded">
            Connect Mapbox for real map visualization
          </div>
        </div>
      </div>

      {/* Active users list */}
      {locationsList.length > 0 && (
        <div className="p-4 border-t border-surface-100 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">
            Active Users
          </p>
          <div className="space-y-2">
            {locationsList.slice(0, 5).map((location) => (
              <div
                key={location.senderId}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                    {location.senderName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      {location.senderName}
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(location.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-surface-600">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                  {location.accuracy && (
                    <p className="text-xs text-surface-400">
                      Accuracy: {Math.round(location.accuracy)}m
                    </p>
                  )}
                </div>
              </div>
            ))}
            {locationsList.length > 5 && (
              <p className="text-center text-sm text-surface-500 py-2">
                +{locationsList.length - 5} more users
              </p>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-surface-900/50 -z-10"
          onClick={onToggleFullscreen}
        />
      )}
    </Card>
  );
};

export default MapView;
