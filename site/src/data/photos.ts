export type PhotoLayout = 'portrait' | 'wide' | 'feature' | 'feature-wide';

export interface PhotoItem {
  index: number;
  src: string;
  thumb: string;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  alt: string;
  title: string;
  description: string;
  layout: PhotoLayout;
}

export interface PhotoSeries {
  id: string;
  name: string;
  nameEn: string;
  nav: string;
  description: string;
  photos: PhotoItem[];
}

interface NumberedSeriesInput {
  count: number;
  directory: string;
  prefix: string;
  extension: 'webp' | 'jpeg';
  altPrefix: string;
  titlePrefix: string;
  description: string;
  layouts: PhotoLayout[];
  dimensions: Array<[number, number]>;
  thumbHeights: number[];
}

type PhotoItemInput = Omit<PhotoItem, 'index'>;

function numberedPhotos(input: NumberedSeriesInput): PhotoItemInput[] {
  if (
    input.layouts.length !== input.count ||
    input.dimensions.length !== input.count ||
    input.thumbHeights.length !== input.count
  ) {
    throw new Error(`Photo metadata count mismatch for ${input.directory}`);
  }

  return Array.from({ length: input.count }, (_, index) => {
    const number = index + 1;
    const base = `/photos/${input.directory}/${input.prefix}-${number}`;
    const [width, height] = input.dimensions[index];
    return {
      src: `${base}.${input.extension}`,
      thumb: `${base}-thumb.webp`,
      width,
      height,
      thumbWidth: 800,
      thumbHeight: input.thumbHeights[index],
      alt: `${input.altPrefix} ${number}`,
      title: `${input.titlePrefix} · ${String(number).padStart(2, '0')}`,
      description: input.description,
      layout: input.layouts[index],
    };
  });
}

const seriesInputs: Array<Omit<PhotoSeries, 'photos'> & { photos: PhotoItemInput[] }> = [
  {
    id: 'qingdao',
    name: '青岛',
    nameEn: 'Qingdao',
    nav: '青岛 Qingdao',
    description: '海风、老街与日落。沿着海岸线走过的那些午后。',
    photos: numberedPhotos({
      count: 18,
      directory: 'qingdao',
      prefix: 'qingdao',
      extension: 'webp',
      altPrefix: '青岛系列照片',
      titlePrefix: '青岛',
      description: 'Qingdao',
      layouts: [
        'feature', 'portrait', 'portrait', 'portrait', 'portrait', 'portrait',
        'portrait', 'portrait', 'portrait', 'wide', 'portrait', 'portrait',
        'portrait', 'portrait', 'wide', 'wide', 'wide', 'feature',
      ],
      dimensions: [
        [2000, 3000], [2000, 3000], [2000, 3000], [2000, 2666], [2000, 3000], [2000, 2999],
        [2000, 3000], [2000, 3000], [1993, 2989], [2000, 1333], [2000, 2666], [2000, 3000],
        [2000, 2666], [2000, 3000], [2000, 1500], [2000, 1333], [2000, 1333], [2000, 3000],
      ],
      thumbHeights: [1200, 1200, 1200, 1067, 1200, 1200, 1200, 1200, 1200, 534, 1067, 1200, 1067, 1200, 600, 534, 534, 1200],
    }),
  },
  {
    id: 'sanya',
    name: '三亚',
    nameEn: 'Sanya',
    nav: '三亚 Sanya',
    description: '热带的海，南国的光。',
    photos: numberedPhotos({
      count: 7,
      directory: 'sanya',
      prefix: 'sanya',
      extension: 'jpeg',
      altPrefix: '三亚系列照片',
      titlePrefix: '三亚',
      description: 'Sanya',
      layouts: ['portrait', 'feature-wide', 'wide', 'portrait', 'wide', 'portrait', 'wide'],
      dimensions: [[724, 1086], [1086, 724], [540, 360], [724, 1086], [1086, 724], [360, 540], [1086, 724]],
      thumbHeights: [1200, 534, 534, 1200, 534, 1200, 534],
    }),
  },
  {
    id: 'f1-2025',
    name: 'F1 2025 上海',
    nameEn: 'F1 2025 Shanghai',
    nav: 'F1 2025',
    description: '引擎轰鸣，赛道与速度。',
    photos: numberedPhotos({
      count: 8,
      directory: 'f1-2025-shanghai',
      prefix: 'f1',
      extension: 'jpeg',
      altPrefix: 'F1 2025 上海系列照片',
      titlePrefix: 'F1 2025',
      description: 'F1 Shanghai 2025',
      layouts: ['feature', 'portrait', 'portrait', 'portrait', 'portrait', 'wide', 'wide', 'feature-wide'],
      dimensions: [[627, 1252], [768, 1024], [627, 1252], [628, 1252], [628, 1252], [540, 360], [540, 360], [1086, 724]],
      thumbHeights: [1598, 1067, 1598, 1595, 1595, 534, 534, 534],
    }),
  },
  {
    id: 'moments',
    name: 'Moments',
    nameEn: 'Miscellaneous',
    nav: 'Moments',
    description: '散落的瞬间，赛道、雨后、花季与海。',
    photos: [
      { src: '/photos/photo-1.webp', thumb: '/photos/photo-1-thumb.webp', width: 2000, height: 1351, thumbWidth: 800, thumbHeight: 541, alt: 'F1 赛车比赛瞬间', title: 'Racing Day', description: 'F1 Shanghai', layout: 'feature-wide' },
      { src: '/photos/photo-2.webp', thumb: '/photos/photo-2-thumb.webp', width: 2000, height: 3000, thumbWidth: 800, thumbHeight: 1200, alt: '雨后湿润的木栈道', title: 'Rainy Boardwalk', description: 'After rain, somewhere green.', layout: 'portrait' },
      { src: '/photos/photo-3.webp', thumb: '/photos/photo-3-thumb.webp', width: 1993, height: 2989, thumbWidth: 800, thumbHeight: 1200, alt: '春日樱花盛开', title: 'Spring Bloom', description: 'Cherry blossoms season.', layout: 'portrait' },
      { src: '/photos/photo-4.webp', thumb: '/photos/photo-4-thumb.webp', width: 2000, height: 3000, thumbWidth: 800, thumbHeight: 1200, alt: '仙人掌花园中的人像', title: 'Cactus Garden', description: 'Succulent & me.', layout: 'portrait' },
      { src: '/photos/photo-5.webp', thumb: '/photos/photo-5-thumb.webp', width: 2000, height: 3000, thumbWidth: 800, thumbHeight: 1200, alt: '走进森林的小路', title: 'Into the Woods', description: 'Just walking, thinking.', layout: 'portrait' },
      { src: '/photos/photo-6.webp', thumb: '/photos/photo-6-thumb.webp', width: 2000, height: 2666, thumbWidth: 800, thumbHeight: 1067, alt: '海边站立的人像', title: 'Sea Breeze', description: 'Standing still, waves crashing.', layout: 'portrait' },
    ],
  },
];

let globalPhotoIndex = 0;

export const photoSeries: PhotoSeries[] = seriesInputs.map((series) => ({
  ...series,
  photos: series.photos.map((photo) => ({ ...photo, index: globalPhotoIndex++ })),
}));

export const photoCount = photoSeries.reduce((total, series) => total + series.photos.length, 0);
