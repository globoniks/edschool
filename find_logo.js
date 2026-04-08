async function run() {
  const r = await fetch('https://www.globoniks.com');
  const text = await r.text();
  const imgMatches = text.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  if (imgMatches) {
    console.log("Images:");
    imgMatches.forEach(m => console.log(m));
  }
}
run();
