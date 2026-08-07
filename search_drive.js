const fs = require('fs');

async function main() {
  const res = await fetch('https://drive.google.com/drive/u/0/folders/1LZq_bXxNjgVZuz4kV2P-mA2fYLtJ5exm');
  const text = await res.text();
  
  console.log("Page title:", text.match(/<title>(.*?)<\/title>/)?.[1]);
  
  // Save page to check if needed
  fs.writeFileSync('drive_folder.html', text);
  
  // Let's find patterns in the script tags. Google Drive lists files in a JS object/array.
  // We can look for strings like "jpg", "png", "jpeg", "webp"
  const regex = /"([^"]+?\.(?:jpg|png|jpeg|webp))"/gi;
  const matches = [...text.matchAll(regex)];
  console.log("Found matches with image extensions:", matches.length);
  const uniqueMatches = Array.from(new Set(matches.map(m => m[1])));
  console.log("Unique image files:", uniqueMatches);

  // Let's also search for typical Google Drive IDs.
  // Google Drive IDs are 33-character alphanumeric strings. Let's look for combinations of ID + image name
  // Google Drive initial payload often has JSON strings. Let's search for lines containing both an image extension and a potential ID
  const lines = text.split('\n');
  const matchingLines = [];
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('.jpg') || line.toLowerCase().includes('.png') || line.toLowerCase().includes('.jpeg')) {
      matchingLines.push({ index, length: line.length });
    }
  });
  console.log(`Found ${matchingLines.length} lines with image extensions.`);
  
  // Let's print snippets from lines that contain matches
  for (const match of matchingLines.slice(0, 5)) {
    const line = lines[match.index];
    console.log(`Line ${match.index} (len ${line.length}):`);
    // Find where the image extension is and print 300 characters around it
    const idx = line.search(/\.(?:jpg|png|jpeg|webp)/i);
    if (idx !== -1) {
      console.log("Snippet:", line.slice(Math.max(0, idx - 150), Math.min(line.length, idx + 150)));
    }
  }
}

main().catch(console.error);
