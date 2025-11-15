import React from "react";
export default function Thumb({ src, alt="", size=48, className="" }){
  if(!src) return <div className={"bg-gray-800 rounded-md"} style={{width:size, height:size}}/>;
  return (
    <img
      src={src}
      alt={alt}
      className={"rounded-md object-cover " + className}
      style={{width:size, height:size}}
      loading="lazy"
      decoding="async"
    />
  );
}
