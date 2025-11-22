import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Helper function to wrap index
function wrap(min, max, value) {
  const range = max - min;
  if (range === 0) return min;
  return ((value - min) % range + range) % range + min;
}

export default function FeatureCarousel({ features = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Auto-play carousel
  useEffect(() => {
    if (features.length <= 1) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setSelectedIndex((prev) => wrap(0, features.length, prev + 1));
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [features.length]);

  function setSlide(newDirection) {
    const nextIndex = wrap(0, features.length, selectedIndex + newDirection);
    setSelectedIndex(nextIndex);
    setDirection(newDirection);
  }

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
            onClick={() => setSlide(-1)}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-blue-500/30 hover:border-blue-500/50 transition-colors z-10 bg-gray-900/80 backdrop-blur-sm flex-shrink-0"
            aria-label="Previous feature"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
          </motion.button>
        )}

        {/* Feature Card - Full width like Kalshi */}
        <div className="flex-1 w-full">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <FeatureSlide
              key={selectedIndex}
              feature={currentFeature}
              direction={direction}
            />
          </AnimatePresence>
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
            onClick={() => setSlide(1)}
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
                const newDirection = index > selectedIndex ? 1 : -1;
                setDirection(newDirection);
                setSelectedIndex(index);
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
      x: dir > 0 ? 300 : -300,
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
      x: dir < 0 ? 300 : -300,
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
      className="w-full"
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

