(() => {
  const output = document.getElementById('output');
  const status = document.getElementById('status');
  const urls = new Set();
  let generation = 0;
  function row(node) {
    const div = document.createElement('div'); div.className = 'outputElement'; div.append(node);
    const time = document.createElement('span'); time.textContent = new Date().toLocaleTimeString(); div.append(time); output.prepend(div);
  }
  function appendText(text) { const p = document.createElement('p'); p.textContent = text; row(p); }
  function appendImage(blob) {
    const img = document.createElement('img'); img.alt = 'Pasted image';
    const url = URL.createObjectURL(blob); urls.add(url);
    const release = () => { if (urls.delete(url)) URL.revokeObjectURL(url); };
    img.addEventListener('load', release, { once: true }); img.addEventListener('error', release, { once: true });
    img.src = url; row(img);
  }
  function clear() { generation++; for (const url of urls) URL.revokeObjectURL(url); urls.clear(); output.replaceChildren(); status.textContent = ''; }
  document.getElementById('clear').addEventListener('click', clear);
  window.addEventListener('pagehide', clear);
  document.addEventListener('paste', async event => {
    const id = ++generation;
    const data = event.clipboardData;
    const images = Array.from(data?.files || []).filter(file => file.type.startsWith('image/'));
    const plain = data?.getData('text/plain') || '';
    const html = data?.getData('text/html') || '';
    // Event payload is synchronous, permission-free and preferred. Each image is shown;
    // plain text wins over HTML, which remains literal text and is never executed.
    if (images.length || plain || html) {
      event.preventDefault(); status.textContent = '';
      for (const file of images) appendImage(file);
      if (plain || html) appendText(plain || html);
      return;
    }
    if (typeof navigator.clipboard?.read !== 'function') { status.textContent = 'No supported clipboard content is available.'; return; }
    event.preventDefault();
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (id !== generation) return;
        const imageType = item.types.find(type => type.startsWith('image/'));
        const type = imageType || (item.types.includes('text/plain') ? 'text/plain' : item.types.includes('text/html') ? 'text/html' : null);
        if (!type) continue;
        const blob = await item.getType(type);
        if (id !== generation) return;
        if (imageType) appendImage(blob);
        else { const text = await blob.text(); if (id !== generation) return; appendText(text); }
      }
      if (id === generation) status.textContent = '';
    } catch { if (id === generation) status.textContent = 'Clipboard access was denied or unavailable. Try pasting text or an image directly.'; }
  });
})();
