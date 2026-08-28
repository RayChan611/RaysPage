export type PhotoLayout = 'portrait' | 'wide' | 'feature' | 'feature-wide';

export interface PhotoItem {
  index: number;
  src: string;
  small: string;
  compact: string;
  thumb: string;
  medium?: string;
  width: number;
  height: number;
  smallWidth: number;
  compactWidth: number;
  thumbWidth: number;
  thumbHeight: number;
  mediumWidth?: number;
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
  alts: string[];
  titlePrefix: string;
  description: string;
  layouts: PhotoLayout[];
  dimensions: Array<[number, number]>;
  thumbHeights: number[];
}

type PhotoItemInput = Omit<
  PhotoItem,
  'index' | 'small' | 'smallWidth' | 'compact' | 'compactWidth' | 'medium' | 'mediumWidth'
>;

function numberedPhotos(input: NumberedSeriesInput): PhotoItemInput[] {
  if (
    input.layouts.length !== input.count ||
    input.dimensions.length !== input.count ||
    input.thumbHeights.length !== input.count ||
    input.alts.length !== input.count
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
      alt: input.alts[index],
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
      alts: [
        '雾天海岸边的沙滩与礁石',
        '戴黑色渔夫帽的人站在常青树旁',
        '云雾中的青岛红瓦屋顶与远处高楼',
        '从室内窗框望见盛开的白花',
        '高大常青树夹道的路上一个行人',
        '蓝天下的白色春花特写',
        '雾中空旷的林荫道路',
        '海边礁石、蓝色海面与远处建筑',
        '蓝天下盛开的浅粉色花朵',
        '俯瞰青岛海水浴场及沿岸建筑',
        '逆光阳光穿过满树白花',
        '冬日法桐夹道的安静街道',
        '将浓缩咖啡浇在香草冰淇淋上',
        '夜色中亮灯的青岛教堂双塔',
        '雾中红瓦老城与远处城市天际线',
        '戴眼镜的人坐在树林长椅上',
        '林间弯曲步道与环形长椅',
        '冬日公园里的高大落叶树',
      ],
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
      alts: [
        '热带绿植之间望向湛蓝海面',
        '礁石海岸边悬挂的木牌与椰子',
        '蓝天下伸向海面的观景平台',
        '傍晚海滩上的人像剪影',
        '戴黑色渔夫帽的人倚栏眺望海面',
        '阴天下浪花拍打深色礁石海岸',
        '阳光下延伸入蓝色海面的岩岸',
      ],
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
      alts: [
        '三组法拉利赛车在上海赛道高速驶过的拼图',
        '两人在 2025 上海大奖赛标识前合影',
        '三组迈凯伦橙色赛车在上海赛道驶过的拼图',
        '三组红牛赛车在上海赛道驶过的拼图',
        '威廉姆斯、梅赛德斯与阿斯顿·马丁赛车拼图',
        '法拉利赛车在上海赛道高速驶过',
        '从看台远望上海赛道上的赛车与观众',
        '红牛赛车在上海赛道高速驶过',
      ],
      titlePrefix: 'F1 2025',
      description: 'F1 Shanghai 2025',
      layouts: ['feature', 'portrait', 'portrait', 'portrait', 'portrait', 'wide', 'wide', 'feature-wide'],
      dimensions: [[627, 1252], [768, 1024], [627, 1252], [628, 1252], [628, 1252], [540, 360], [540, 360], [1086, 724]],
      thumbHeights: [1598, 1067, 1598, 1595, 1595, 534, 534, 534],
    })
      .filter((photo) => photo.src !== '/photos/f1-2025-shanghai/f1-2.jpeg')
      .map((photo, index) => ({
        ...photo,
        title: `F1 2025 · ${String(index + 1).padStart(2, '0')}`,
      })),
  },
  {
    id: 'moments',
    name: 'Moments',
    nameEn: 'Miscellaneous',
    nav: 'Moments',
    description: '散落的瞬间，赛道、雨后、花季与林间。',
    photos: [
      { src: '/photos/photo-1.webp', thumb: '/photos/photo-1-thumb.webp', width: 2000, height: 1351, thumbWidth: 800, thumbHeight: 541, alt: 'F1 赛车比赛瞬间', title: 'Racing Day', description: 'F1 Shanghai', layout: 'feature-wide' },
      { src: '/photos/photo-2.webp', thumb: '/photos/photo-2-thumb.webp', width: 2000, height: 3000, thumbWidth: 800, thumbHeight: 1200, alt: '雨后湿润的木栈道', title: 'Rainy Boardwalk', description: 'After rain, somewhere green.', layout: 'portrait' },
      { src: '/photos/photo-3.webp', thumb: '/photos/photo-3-thumb.webp', width: 1993, height: 2989, thumbWidth: 800, thumbHeight: 1200, alt: '春日樱花盛开', title: 'Spring Bloom', description: 'Cherry blossoms season.', layout: 'portrait' },
      { src: '/photos/photo-5.webp', thumb: '/photos/photo-5-thumb.webp', width: 2000, height: 3000, thumbWidth: 800, thumbHeight: 1200, alt: '走进森林的小路', title: 'Into the Woods', description: 'Just walking, thinking.', layout: 'portrait' },
    ],
  },
];

let globalPhotoIndex = 0;

export const photoSeries: PhotoSeries[] = seriesInputs.map((series) => ({
  ...series,
  photos: series.photos.map((photo) => {
    const smallWidth = 400;
    const compactWidth = 600;
    const mediumWidth = photo.width > photo.thumbWidth ? Math.min(photo.width, 1280) : undefined;
    return {
      ...photo,
      index: globalPhotoIndex++,
      small: photo.src.replace(/\.[^.]+$/, `-${smallWidth}.webp`),
      smallWidth,
      compact: photo.src.replace(/\.[^.]+$/, `-${compactWidth}.webp`),
      compactWidth,
      medium: mediumWidth ? photo.src.replace(/\.[^.]+$/, '-medium.webp') : undefined,
      mediumWidth,
    };
  }),
}));

export const photoCount = photoSeries.reduce((total, series) => total + series.photos.length, 0);
