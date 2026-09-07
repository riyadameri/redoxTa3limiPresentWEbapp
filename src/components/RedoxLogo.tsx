import React, { useState } from 'react';
import logoPng from '../assets/logo.png';

interface RedoxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const RedoxLogo: React.FC<RedoxLogoProps> = ({ 
  className = '',
  size = 'md',
  showText = false
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24'
  };

  const chosenSize = className || sizeMap[size];

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <div className={`relative flex items-center justify-center rounded-2xl bg-white p-1 shadow-md shadow-slate-950/20 overflow-hidden ${chosenSize}`}>
        {!imgError ? (
          <img
            src={logoPng}
            alt="Redox Logo"
            className="w-full h-full object-contain p-0.5 scale-105 transition-transform duration-300 hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 500 500"
            className="w-full h-full drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="redoxGradientVector" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#FBA41A" />
                <stop offset="35%" stopColor="#F76B1C" />
                <stop offset="70%" stopColor="#F04826" />
                <stop offset="100%" stopColor="#DE2929" />
              </linearGradient>
            </defs>

            {/* Top loop with orange-to-red gradient */}
            <path
              d="M 175 140
                 C 175 125, 188 112, 205 112
                 L 275 112
                 C 335 112, 385 160, 385 220
                 C 385 272, 345 315, 295 322
                 C 265 300, 240 265, 230 240
                 C 260 235, 295 210, 295 178
                 C 295 158, 280 148, 260 148
                 L 205 148
                 C 188 148, 175 140, 175 140 Z"
              fill="url(#redoxGradientVector)"
            />

            {/* Left middle horizontal tab in navy */}
            <path
              d="M 170 205
                 C 170 192, 180 182, 195 182
                 L 245 182
                 C 255 182, 262 192, 260 205
                 C 258 218, 250 226, 238 226
                 L 195 226
                 C 180 226, 170 218, 170 205 Z"
              fill="#0B203E"
            />

            {/* Bottom navy arch and legs */}
            <path
              d="M 175 320
                 C 175 255, 215 220, 265 220
                 C 285 220, 310 240, 335 280
                 L 375 348
                 C 388 368, 380 388, 360 388
                 C 345 388, 332 375, 320 355
                 L 290 305
                 C 278 285, 265 275, 252 275
                 C 235 275, 222 290, 222 315
                 L 222 360
                 C 222 375, 210 385, 195 385
                 C 180 385, 175 372, 175 355
                 Z"
              fill="#0B203E"
            />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-black text-white text-base tracking-wider leading-none">
              REDOX
            </span>
            <span className="font-bold text-cyan-400 text-sm leading-none">
              تعليمي
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
            نظام إدارة المدارس المتكامل
          </span>
        </div>
      )}
    </div>
  );
};
