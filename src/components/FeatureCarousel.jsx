import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getSessionId } from "../lib/sessionId.js";
import { getApiUrl } from "/src/api.js";

// Helper function to wrap index - ensures endless looping
function wrapIndex(currentIndex, direction, arrayLength) {
  if (arrayLength === 0) return 0;
  if (arrayLength === 1) return 0;
  
  // Calculate next index
  let nextIndex = currentIndex + direction;
  
  // Loop forward: if past the end, go to beginning
  if (nextIndex >= arrayLength) {
    nextIndex = 0;
  }
  // Loop backward: if before the start, go to end
  else if (nextIndex < 0) {
    nextIndex = arrayLength - 1;
  }
  
  return nextIndex;
}

export default function FeatureCarousel({ features = [], subjects = [] }) {
  // Generate unique instance ID - compute once at component level (not in hooks)
  const sessionId = getSessionId();
  const mountTime = Date.now() + Math.random();
  const instanceId = `${sessionId}_${mountTime}`;
  
  // Log for debugging (always log to help diagnose)
  console.log('🔵 FeatureCarousel mounted with instanceId:', instanceId, 'sessionId:', sessionId);
  
  const [selectedIndex, setSelectedIndex] = useState(0); // Always start at index 0
  const [direction, setDirection] = useState(1);
  
  // Only reset index if features array length actually changes (not on every update)
  const prevFeaturesLength = useRef(features.length);
  const prevFeaturesIds = useRef(features.map(f => f.id).join(','));
  const isManualControl = useRef(false);
  
  useEffect(() => {
    const currentIds = features.map(f => f.id).join(',');
    const lengthChanged = features.length !== prevFeaturesLength.current;
    const idsChanged = currentIds !== prevFeaturesIds.current;
    
    if (lengthChanged || idsChanged) {
      console.log(`🔵 [${instanceId}] Features array changed:`, {
        lengthChanged,
        idsChanged,
        oldLength: prevFeaturesLength.current,
        newLength: features.length,
        oldIds: prevFeaturesIds.current,
        newIds: currentIds,
        sessionId: sessionId
      });
      
      // Only reset if length changed (not just IDs) - always reset to 0
      if (lengthChanged && features.length > 0) {
        console.log(`🔵 [${instanceId}] Resetting carousel index to: 0`);
        setSelectedIndex(0);
      }
      
      prevFeaturesLength.current = features.length;
      prevFeaturesIds.current = currentIds;
    }
  }, [features, instanceId, sessionId]);
  
  const setSlide = useCallback((newDirection) => {
    // Always loop - no stopping at ends
    const nextIndex = wrapIndex(selectedIndex, newDirection, features.length);
    console.log(`🔵 [${instanceId}] Carousel slide:`, { 
      from: selectedIndex, 
      to: nextIndex, 
      direction: newDirection,
      totalFeatures: features.length,
      sessionId: sessionId,
      timestamp: Date.now()
    });
    setSelectedIndex(nextIndex);
    setDirection(newDirection);
  }, [features.length, selectedIndex, instanceId, sessionId]);
  
  // Track manual control to prevent auto-play from interfering
  const handleManualSlide = useCallback((newDirection) => {
    console.log(`🔵 [${instanceId}] ⚡ MANUAL CLICK - Manual slide triggered:`, { 
      direction: newDirection,
      currentIndex: selectedIndex,
      sessionId: sessionId,
      timestamp: Date.now(),
      stack: new Error().stack
    });
    isManualControl.current = true;
    setSlide(newDirection);
    // Reset manual control flag after a delay
    setTimeout(() => {
      isManualControl.current = false;
    }, 6000);
  }, [setSlide, selectedIndex, instanceId, sessionId]);

  if (features.length === 0) return null;

  const currentFeature = features[selectedIndex];

  return (
    <div className="mb-24 relative w-full">
      <div className="relative flex items-center justify-center gap-4 w-full">
        {/* Previous Button - Always show if there are features (even with 1, for consistency) */}
        {features.length > 0 && (
          <motion.button
            initial={false}
            animate={{ 
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              scale: 1
            }}
            whileHover={{ 
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              scale: 1.1
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleManualSlide(-1)}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-blue-500/30 hover:border-blue-500/50 transition-colors z-10 bg-gray-900/80 backdrop-blur-sm flex-shrink-0"
            aria-label="Previous feature"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
          </motion.button>
        )}

        {/* Feature Card - Full width like Kalshi with fixed height container */}
        <div className="flex-1 w-full relative" style={{ minHeight: '300px' }}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <FeatureSlide
                key={selectedIndex}
                feature={currentFeature}
                direction={direction}
                subjects={subjects}
              />
            </AnimatePresence>
        </div>

        {/* Next Button - Always show if there are features */}
        {features.length > 0 && (
          <motion.button
            initial={false}
            animate={{ 
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              scale: 1
            }}
            whileHover={{ 
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              scale: 1.1
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleManualSlide(1)}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-blue-500/30 hover:border-blue-500/50 transition-colors z-10 bg-gray-900/80 backdrop-blur-sm flex-shrink-0"
            aria-label="Next feature"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
          </motion.button>
        )}
      </div>

      {/* Dots Indicator */}
      {features.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 mb-4">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                isManualControl.current = true;
                const newDirection = index > selectedIndex ? 1 : -1;
                setDirection(newDirection);
                setSelectedIndex(index);
                setTimeout(() => {
                  isManualControl.current = false;
                }, 6000);
              }}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? "w-8 h-2 bg-blue-500"
                  : "w-2 h-2 bg-gray-600 hover:bg-gray-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureSlide({ feature, direction, subjects = [] }) {
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  // Check if feature has a subject link (via subjectSlug or subject_id)
  const subject = feature.subjectSlug 
    ? subjects.find(s => s.slug === feature.subjectSlug)
    : feature.subject_id
    ? subjects.find(s => s.id === feature.subject_id)
    : null;
  
  const content = feature.url ? (
    <a
      href={feature.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <FeatureCardContent feature={feature} subject={subject} />
    </a>
  ) : subject ? (
    <Link to={`/subjects/${subject.slug}`} className="block">
      <FeatureCardContent feature={feature} subject={subject} />
    </Link>
  ) : (
    <FeatureCardContent feature={feature} subject={subject} />
  );

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full relative"
    >
      {content}
    </motion.div>
  );
}

function FeatureCardContent({ feature, subject }) {
  // Convert relative image URLs to absolute URLs
  const getImageUrl = (url) => {
    if (!url) return null;
    // If it's already a full URL (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path starting with /, prepend API base URL
    if (url.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_URL || '';
      if (apiBase) {
        return `${apiBase}${url}`;
      }
      // In development, use relative path (Vite proxy will handle it)
      return url;
    }
    return url;
  };

  const imageUrl = getImageUrl(feature.imageUrl);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-all shadow-2xl cursor-pointer">
      <div className="relative">
        {imageUrl ? (
          <div className="relative h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
            <img
              src={imageUrl}
              alt={feature.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          </div>
        ) : (
          <div className="h-[300px] md:h-[350px] lg:h-[400px] bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900/40 flex items-center justify-center">
            <div className="text-6xl opacity-30">📊</div>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight drop-shadow-lg">
              {feature.title}
            </h2>
            {feature.description && (
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 leading-relaxed drop-shadow-md">
                {feature.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

