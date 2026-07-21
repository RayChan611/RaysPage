/* ============================================
   Photo Series Data + Renderer
   Add a new series by appending to PHOTO_SERIES.
   ============================================ */

(function () {
  'use strict';

  // ---- Photo series data (single source of truth) ----
  const PHOTO_SERIES = [
    {
      id: 'qingdao',
      galleryId: 'gallery-qingdao',
      name: '青岛',
      nameEn: 'Qingdao',
      photos: Array.from({ length: 18 }, (_, i) => ({
        webp: `photos/qingdao/qingdao-${i + 1}.webp`,
        alt: `青岛系列照片 ${i + 1}`,
        title: `青岛 · ${String(i + 1).padStart(2, '0')}`,
        desc: 'Qingdao',
      })),
    },
    {
      id: 'sanya',
      galleryId: 'gallery-sanya',
      name: '三亚',
      nameEn: 'Sanya',
      photos: Array.from({ length: 7 }, (_, i) => ({
        webp: `photos/sanya/sanya-${i + 1}.jpeg`,
        alt: `三亚系列照片 ${i + 1}`,
        title: `三亚 · ${String(i + 1).padStart(2, '0')}`,
        desc: 'Sanya',
      })),
    },
    {
      id: 'f1-2025',
      galleryId: 'gallery-f1-2025',
      name: 'F1 2025 上海',
      nameEn: 'F1 2025 Shanghai',
      photos: Array.from({ length: 8 }, (_, i) => ({
        webp: `photos/f1-2025-shanghai/f1-${i + 1}.jpeg`,
        alt: `F1 2025 上海系列照片 ${i + 1}`,
        title: `F1 2025 · ${String(i + 1).padStart(2, '0')}`,
        desc: 'F1 Shanghai 2025',
      })),
    },
    {
      id: 'moments',
      galleryId: 'gallery-moments',
      name: 'Moments',
      nameEn: 'Moments',
      photos: [
        { webp: 'photos/photo-1.webp', alt: 'F1 赛车比赛瞬间', title: 'Racing Day', desc: 'F1 Shanghai' },
        { webp: 'photos/photo-2.webp', alt: '雨后湿润的木栈道', title: 'Rainy Boardwalk', desc: 'After rain, somewhere green.' },
        { webp: 'photos/photo-3.webp', alt: '春日樱花盛开', title: 'Spring Bloom', desc: 'Cherry blossoms season.' },
        { webp: 'photos/photo-4.webp', alt: '仙人掌花园中的人像', title: 'Cactus Garden', desc: 'Succulent & me.' },
        { webp: 'photos/photo-5.webp', alt: '走进森林的小路', title: 'Into the Woods', desc: 'Just walking, thinking.' },
        { webp: 'photos/photo-6.webp', alt: '海边站立的人像', title: 'Sea Breeze', desc: 'Standing still, waves crashing.' },
      ],
    },
  ];

  // ---- Derive the thumbnail URL from the full-size source.
  //      photo.webp is the full-res image used by the lightbox; the gallery
  //      grid renders a smaller -thumb.webp (800px) so the listing page only
  //      downloads ~30KB per tile instead of the multi-hundred-KB original.
  function thumbOf(src) {
    return src.replace(/\.(webp|jpeg|jpg|png)$/i, '-thumb.webp');
  }

  // ---- Render a single gallery item ----
  function renderItem(photo, globalIdx) {
    const num = String(globalIdx + 1).padStart(2, '0');
    const full = photo.webp;
    const thumb = thumbOf(full);
    return `
        <div class="gallery-item animate-on-scroll" data-title="${photo.title}" data-series="${photo.seriesName || ''}" data-full="${full}" role="button" tabindex="0" aria-haspopup="dialog" aria-label="${photo.title} - 点击查看大图">
          <img src="${thumb}" srcset="${thumb} 800w, ${full} 1600w" sizes="(max-width: 768px) 50vw, 33vw" alt="${photo.alt}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${full}'" />
          <div class="gallery-overlay">
            <span class="gallery-number">${num}</span>
            <h3>${photo.title}</h3>
            <p>${photo.desc}</p>
          </div>
        </div>`;
  }

  // ---- Render all series ----
  function renderGalleries() {
    let globalIdx = 0;
    PHOTO_SERIES.forEach(series => {
      const container = document.getElementById(series.galleryId);
      if (!container) return;
      const html = series.photos.map(photo => {
        photo.seriesName = series.name;
        const item = renderItem(photo, globalIdx);
        globalIdx += 1;
        return item;
      }).join('\n');
      container.innerHTML = html;
    });
  }

  // Expose for photos.js
  window.PHOTO_SERIES = PHOTO_SERIES;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGalleries);
  } else {
    renderGalleries();
  }
})();
