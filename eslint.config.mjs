import prettierConfig from 'eslint-config-prettier';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  Promise: 'readonly',
  fetch: 'readonly',
  Event: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  URLSearchParams: 'readonly',
  location: 'readonly',
  getComputedStyle: 'readonly',
  module: 'writable',
};

const projectGlobals = {
  kakao: 'readonly',
  jQuery: 'readonly',
  $: 'readonly',
  Swiper: 'readonly',
  BaseDataMapper: 'writable',
  ImageHelpers: 'readonly',
  HeaderFooterMapper: 'readonly',
  IndexMapper: 'readonly',
  MainMapper: 'readonly',
  RoomMapper: 'readonly',
  FacilityMapper: 'readonly',
  ReservationMapper: 'readonly',
  DirectionsMapper: 'readonly',
  RoomListMapper: 'readonly',
  NearbyAttractionsMapper: 'readonly',
  LayoutMapMapper: 'readonly',
};

export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...browserGlobals,
        ...projectGlobals,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'off',
      eqeqeq: ['warn', 'always'],
      'no-var': 'off',
    },
  },
  prettierConfig,
];
