import React from 'react'
import { Sparkles, ExternalLink } from 'lucide-react'

const ReelAdContent = ({ ad, onAdClick }) => {
  return (
    <>
      {/* Minimal Ad Badge - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-white/70" />
          <span className="text-white/70 text-xs font-medium">Ad</span>
        </div>
      </div>

      {/* Premium CTA Card - Bottom */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
        
        <div className="relative p-5 pb-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-4">
            {ad.brandLogo && (
              <div className="w-10 h-10 rounded-xl bg-white/95 p-1.5 flex-shrink-0 shadow-xl">
                <img 
                  src={ad.brandLogo} 
                  alt={ad.brandName}
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm truncate">
                {ad.brandName || 'Brand'}
              </h4>
              <p className="text-white/50 text-xs">
                Sponsored
              </p>
            </div>
          </div>

          {/* Ad Content */}
          <div className="mb-4">
            <h3 className="text-white font-bold text-xl sm:text-2xl mb-2 line-clamp-2 leading-tight">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-white/80 text-sm line-clamp-2 mb-3">
                {ad.description}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <button 
            onClick={() => onAdClick(ad)}
            className="w-full bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xl group hover:cursor-pointer"
          >
            <span className="text-base">{ad.ctaText || 'Learn More'}</span>
            <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Link Preview */}
          {ad.ctaLink && ad.ctaLink !== '#' && (
            <div className="mt-2 text-center">
              <span className="text-white/40 text-xs">
                {ad.ctaLink.replace(/^https?:\/\//, '').split('/')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ReelAdContent
