import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSessionId } from "../lib/sessionId.js";

// Helper function to wrap index
function wrap(min, max, value) {
  const range = max - min;
  if (range === 0) return min;
  return ((value - min) % range + range) % range + min;
}

export default function FeatureCarousel({ features = [] }) {
  // Generate unique instance ID using session ID + component mount time to prevent any potential sync issues
  const sessionId = getSessionId();
  const mountTime = useRef(Date.now() + Math.random()).current;
  const instanceId = useRef(`${sessionId}_${mountTime}`).current;
  
  // Log for debugging (always log to help diagnose)
  console.log('🔵 FeatureCarousel mounted with instanceId:', instanceId, 'sessionId:', sessionId);
  
  const [selectedIndex, setSelectedIndex] = useState(() => {
    // Initialize with random index to prevent sync
    return features.length > 0 ? Math.floor(Math.random() * features.length) : 0;
  });
  const [direction, setDirection] = useState(1);
  
  // Only reset index if features array length actually changes (not on every update)
  const prevFeaturesLength = React.useRef(features.length);
  const prevFeaturesIds = React.useRef(features.map(f => f.id).join(','));
  const isManualControl = React.useRef(false);
  
  React.useEffect(() => {
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
      
      // Only reset if length changed (not just IDs)
      if (lengthChanged && features.length > 0) {
        const newIndex = Math.floor(Math.random() * features.length);
        console.log(`🔵 [${instanceId}] Resetting carousel index to:`, newIndex);
        setSelectedIndex(newIndex);
      }
      
      prevFeaturesLength.current = features.length;
      prevFeaturesIds.current = currentIds;
    }
  }, [features, instanceId, sessionId]);
  
  // Track manual control to prevent auto-play from interfering
  const handleManualSlide = React.useCallback((newDirection) => {
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
  }, [setSlide, instanceId, selectedIndex, sessionId]);

  // Auto-play carousel - with random offset to prevent sync across instances
  useEffect(() => {
    if (features.length <= 1) return;
    
    // Add random offset (0-5 seconds) so each instance doesn't sync
    const offset = (parseInt(instanceId.slice(-2), 36) % 5000);
    let intervalId = null;
    
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        // Don't auto-play if user is manually controlling
        if (!isManualControl.current) {
          setDirection(1);
          setSelectedIndex((prev) => wrap(0, features.length, prev + 1));
        }
      }, 5000 + (parseInt(instanceId.slice(-3, -1), 36) % 2000)); // Random interval between 5-7 seconds
    }, offset);
    
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [features.length, instanceId]);

  const setSlide = React.useCallback((newDirection) => {
    const nextIndex = wrap(0, features.length, selectedIndex + newDirection);
    console.log(`🔵 [${instanceId}] Carousel slide:`, { 
      from: selectedIndex, 
      to: nextIndex, 
      direction: newDirection,
      sessionId: sessionId,
      timestamp: Date.now()
    });
    setSelectedIndex(nextIndex);
    setDirection(newDirection);
  }, [features.length, selectedIndex, instanceId, sessionId]);

  if (features.length === 0) return null;

  const currentFeature = features[selectedIndex];

  return (
    <div className="mb-12 relative w-full">
      <div className="relative flex items-center justify-center gap-4 w-full">
        {/* Previous Button */}
        {features.length > 1 && (
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
        <div className="flex-1 w-full relative" style={{ minHeight: '400px' }}>
          <div className="relative w-full" style={{ minHeight: '400px' }}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <FeatureSlide
                key={selectedIndex}
                feature={currentFeature}
                direction={direction}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Next Button */}
        {features.length > 1 && (
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
        <div className="flex items-center justify-center gap-2 mt-6">
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

function FeatureSlide({ feature, direction }) {
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

  const content = feature.url ? (
    <a
      href={feature.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <FeatureCardContent feature={feature} />
    </a>
  ) : (
    <FeatureCardContent feature={feature} />
  );

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full absolute inset-0"
    >
      {content}
    </motion.div>
  );
}

function FeatureCardContent({ feature }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-all shadow-2xl cursor-pointer">
      <div className="relative">
        {feature.imageUrl ? (
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
            <img
              src={feature.imageUrl}
              alt={feature.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          </div>
        ) : (
          <div className="h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900/40 flex items-center justify-center">
            <div className="text-8xl opacity-30">📊</div>
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

