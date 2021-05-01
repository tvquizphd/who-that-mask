const rgb2hsv = (r,g,b) => {
 if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
   alert ('RGB values must be in the range 0 to 255.');
   return;
 }
 r=r/255; g=g/255; b=b/255;
 const minRGB = Math.min(r,Math.min(g,b));
 const maxRGB = Math.max(r,Math.max(g,b));

 // Black-gray-white
 if (minRGB===maxRGB) {
  return [0,0,minRGB];
 }

 // Colors other than black-gray-white:
 const d = (r===minRGB) ? g-b : ((b===minRGB) ? r-g : b-r);
 const h = (r===minRGB) ? 3 : ((b===minRGB) ? 1 : 5);
 const computedH = 60*(h - d/(maxRGB - minRGB));
 const computedS = (maxRGB - minRGB)/maxRGB;
 const computedV = maxRGB;
 return [computedH,computedS,computedV];
}

export {
	rgb2hsv
}
