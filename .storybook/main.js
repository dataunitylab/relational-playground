/** @type { import('@storybook/react).StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/preset-create-react-app',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      lazyCompilation: true,
    },
  },
};
export default config;
