/**
 * Procedural Age Progression Filter for Web Canvas
 */
export function applyAgingFilter(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Keep standard high-res square dimensions suitable for a premium portrait grid
        canvas.width = 600;
        canvas.height = 600;

        // Draw original image scaled & cropped to square center
        const size = Math.min(img.width, img.height);
        const sourceX = (img.width - size) / 2;
        const sourceY = (img.height - size) / 2;
        
        ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, 600, 600);

        // Apply aged color corrections (lower saturation, higher contrast for character, warmer tint)
        // Draw vintage premium warm filter overlay
        ctx.fillStyle = "rgba(224, 218, 196, 0.08)";
        ctx.fillRect(0, 0, 600, 600);

        // We apply a soft silver-grey vignette on the sides/top to simulate hair graying/silvering
        const hairGradient = ctx.createRadialGradient(300, 200, 150, 300, 200, 310);
        hairGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        hairGradient.addColorStop(0.7, "rgba(235, 235, 240, 0.22)");
        hairGradient.addColorStop(1, "rgba(205, 205, 215, 0.45)");
        
        ctx.fillStyle = hairGradient;
        ctx.fillRect(0, 0, 600, 600);

        // Draw procedural aged wrinkles (character lines) on top of the face
        // Standard normalized face placement is centered
        ctx.lineWidth = 1.35;
        ctx.lineCap = "round";
        ctx.shadowBlur = 1.5;
        
        // Forehead lines
        ctx.strokeStyle = "rgba(75, 62, 53, 0.35)";
        ctx.shadowColor = "rgba(255, 255, 255, 0.15)";
        
        // concentric horizontal waves in forehead (Y around 130 to 180)
        ctx.beginPath();
        ctx.arc(300, 480, 330, Math.PI * 1.28, Math.PI * 1.72);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(300, 520, 350, Math.PI * 1.27, Math.PI * 1.73);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(295, 560, 370, Math.PI * 1.28, Math.PI * 1.72);
        ctx.stroke();

        // Eye corner rays (crow's feet)
        // Left Eye zone (X ~ 210, Y ~ 260)
        ctx.strokeStyle = "rgba(70, 58, 50, 0.38)";
        // Ray 1
        ctx.beginPath();
        ctx.moveTo(195, 255);
        ctx.bezierCurveTo(175, 250, 165, 246, 150, 245);
        ctx.stroke();
        // Ray 2
        ctx.beginPath();
        ctx.moveTo(195, 258);
        ctx.bezierCurveTo(170, 260, 155, 262, 142, 265);
        ctx.stroke();
        // Ray 3
        ctx.beginPath();
        ctx.moveTo(197, 262);
        ctx.bezierCurveTo(175, 272, 160, 280, 148, 288);
        ctx.stroke();

        // Right Eye zone (X ~ 390, Y ~ 260)
        // Ray 1
        ctx.beginPath();
        ctx.moveTo(405, 255);
        ctx.bezierCurveTo(425, 250, 435, 246, 450, 245);
        ctx.stroke();
        // Ray 2
        ctx.beginPath();
        ctx.moveTo(405, 258);
        ctx.bezierCurveTo(430, 260, 445, 262, 458, 265);
        ctx.stroke();
        // Ray 3
        ctx.beginPath();
        ctx.moveTo(403, 262);
        ctx.bezierCurveTo(425, 272, 440, 280, 452, 288);
        ctx.stroke();

        // Nasolabial Laugh Folds (Nose corners down past mouth sides)
        // Left fold (from X ~ 240, Y ~ 320 down to X ~ 215, Y ~ 430)
        ctx.lineWidth = 1.9;
        ctx.strokeStyle = "rgba(65, 52, 45, 0.40)";
        ctx.beginPath();
        ctx.moveTo(250, 315);
        ctx.bezierCurveTo(232, 350, 218, 395, 222, 440);
        ctx.stroke();

        // Right fold (from X ~ 360, Y ~ 320 down to X ~ 385, Y ~ 430)
        ctx.beginPath();
        ctx.moveTo(350, 315);
        ctx.bezierCurveTo(368, 350, 382, 395, 378, 440);
        ctx.stroke();

        // Inner eye bag circles (Y ~ 285)
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "rgba(75, 65, 58, 0.28)";
        ctx.beginPath();
        ctx.arc(225, 275, 28, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(375, 275, 28, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        // Add soft, premium silver mist vignette overall to look like a camera filter
        const borderVignette = ctx.createRadialGradient(300, 300, 220, 300, 300, 410);
        borderVignette.addColorStop(0, "rgba(8, 24, 58, 0)");
        borderVignette.addColorStop(1, "rgba(10, 25, 47, 0.55)"); // Deep blue CIMR themed vignette border
        ctx.fillStyle = borderVignette;
        ctx.fillRect(0, 0, 600, 600);

        // Turn canvas back into state URL jpeg
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      } catch (err) {
        console.error("Age progression filter render failed:", err);
        resolve(imageSrc);
      }
    };
    img.onerror = (err) => {
      console.error("Loading image for aging filter failed:", err);
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
}
