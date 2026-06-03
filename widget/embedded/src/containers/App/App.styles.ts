import { styled } from '@arthur2079/ui';

export const MainContainer = styled('div', {
  fontFamily: '$widget',
  boxSizing: 'border-box',
  textAlign: 'left',
  height: '100%',
  '& *, *::before, *::after': {
    boxSizing: 'inherit',
  },
  '& *:focus-visible': {
    outlineColor: '$info500',
    transition: 'none',
  },
  '& ul, ol, li': { listStyleType: 'none' },
});
