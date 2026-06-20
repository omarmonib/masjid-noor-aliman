"use client";

import { useEffect, useState } from "react";
import { Coordinates, Qibla } from "adhan";

const BELBEIS = new Coordinates(30.8708, 31.5588);

export default function QiblaCompass({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [qiblaAngle] = useState(() => Qibla(BELBEIS));
  const [deviceAngle, setDeviceAngle] = useState<number | null>(null);
  const [permission, setPermission] = useState<
    "pending" | "granted" | "denied" | "unsupported"
  >("pending");
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userQibla, setUserQibla] = useState<number | null>(null);

  useEffect(() => {
    // Get user location for accurate Qibla
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = new Coordinates(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUserQibla(Qibla(coords));
      });
    }

    // Device orientation for live compass
    if (typeof DeviceOrientationEvent !== "undefined") {
      const handler = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) {
          setDeviceAngle(e.alpha);
          setPermission("granted");
        }
      };

      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        setPermission("pending");
      } else {
        window.addEventListener("deviceorientation", handler);
        setPermission("granted");
      }

      return () => window.removeEventListener("deviceorientation", handler);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === "granted") {
        setPermission("granted");
        window.addEventListener(
          "deviceorientation",
          (e: DeviceOrientationEvent) => {
            if (e.alpha !== null) setDeviceAngle(e.alpha);
          },
        );
      } else {
        setPermission("denied");
      }
    } catch {
      setPermission("denied");
    }
  };

  const activeQibla = userQibla ?? qiblaAngle;
  const needleRotation =
    deviceAngle !== null ? activeQibla - deviceAngle : activeQibla;

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-arabic text-sm text-gray-500 mb-1">
              {isAr ? "اتجاه القبلة" : "Qibla Direction"}
            </p>
            <p className="font-arabic text-3xl font-bold text-primary">
              {Math.round(activeQibla)}°
            </p>
            <p className="font-arabic text-xs text-gray-400 mt-1">
              {isAr ? "من الشمال باتجاه عقارب الساعة" : "clockwise from North"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-arabic text-sm text-gray-500 mb-1">
              {isAr ? "الموقع" : "Location"}
            </p>
            <p className="font-arabic text-sm font-bold text-gray-700">
              {userCoords
                ? `${userCoords.lat.toFixed(4)}°, ${userCoords.lng.toFixed(4)}°`
                : isAr
                  ? "بلبيس، مصر"
                  : "Belbeis, Egypt"}
            </p>
            <p className="font-arabic text-xs text-gray-400 mt-1">
              {userCoords
                ? isAr
                  ? "موقعك الحالي"
                  : "Your location"
                : isAr
                  ? "الموقع الافتراضي"
                  : "Default location"}
            </p>
          </div>
        </div>
      </div>

      {/* Compass */}
      <div className="flex flex-col items-center">
        <div className="relative w-72 h-72">
          {/* Compass rose background */}
          <div
            className="absolute inset-0 rounded-full border-4 border-gray-200 bg-white shadow-2xl"
            style={{
              boxShadow:
                "0 0 40px rgba(0,0,0,0.15), inset 0 0 20px rgba(0,0,0,0.05)",
            }}
          >
            {/* Cardinal directions */}
            {[
              {
                label: isAr ? "ش" : "N",
                deg: 0,
                top: "4px",
                left: "50%",
                transform: "translateX(-50%)",
              },
              {
                label: isAr ? "ج" : "S",
                deg: 180,
                bottom: "4px",
                left: "50%",
                transform: "translateX(-50%)",
              },
              {
                label: isAr ? "ش.غ" : "E",
                deg: 90,
                top: "50%",
                right: "4px",
                transform: "translateY(-50%)",
              },
              {
                label: isAr ? "غ" : "W",
                deg: 270,
                top: "50%",
                left: "4px",
                transform: "translateY(-50%)",
              },
            ].map(({ label, ...style }) => (
              <div
                key={label}
                className="absolute font-arabic font-bold text-sm text-gray-500"
                style={style as any}
              >
                {label}
              </div>
            ))}

            {/* Degree markers */}
            {Array.from({ length: 36 }, (_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transformOrigin: "0 0",
                  transform: `rotate(${i * 10}deg) translateY(-130px)`,
                }}
              >
                <div
                  className={`w-px ${i % 9 === 0 ? "h-4 bg-gray-400" : "h-2 bg-gray-200"}`}
                />
              </div>
            ))}
          </div>

          {/* Qibla needle */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Kaaba icon at tip */}
              <div
                className="absolute text-2xl"
                style={{
                  top: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                🕋
              </div>
              {/* Needle */}
              <div className="flex flex-col items-center">
                <div
                  className="w-2 rounded-t-full"
                  style={{
                    height: "100px",
                    background: "linear-gradient(to top, #1B6B4A, #C9A84C)",
                  }}
                />
                <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
                <div
                  className="w-2 rounded-b-full bg-gray-300"
                  style={{ height: "50px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Permission button for iOS */}
        {permission === "pending" && (
          <button
            onClick={requestPermission}
            className="mt-6 bg-primary text-white font-arabic px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            {isAr ? "تفعيل البوصلة الحية" : "Enable Live Compass"}
          </button>
        )}

        {permission === "granted" && deviceAngle !== null && (
          <p className="mt-4 font-arabic text-sm text-primary">
            ✅{" "}
            {isAr
              ? "البوصلة تعمل — وجّه هاتفك نحو القبلة"
              : "Compass active — point your device toward Qibla"}
          </p>
        )}

        {permission === "unsupported" && (
          <p className="mt-4 font-arabic text-sm text-gray-500 text-center">
            {isAr
              ? "جهازك لا يدعم البوصلة الحية — الاتجاه أعلاه محسوب بناءً على موقعك"
              : "Your device doesn't support live compass — direction above is calculated from your location"}
          </p>
        )}
      </div>

      {/* Distance to Makkah */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
        <p className="font-arabic text-sm text-gray-500 mb-1">
          {isAr ? "المسافة إلى مكة المكرمة" : "Distance to Makkah"}
        </p>
        <p className="font-arabic text-3xl font-bold text-primary">
          {userCoords
            ? `${Math.round(haversine(userCoords.lat, userCoords.lng, 21.4225, 39.8262))} km`
            : "1,478 km"}
        </p>
        <p className="font-arabic text-xs text-gray-400 mt-1">
          {isAr ? "تقريباً من موقعك" : "approximately from your location"}
        </p>
      </div>
    </div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
