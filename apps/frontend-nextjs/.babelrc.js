module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-react': {
          runtime: 'automatic',
        },
      },
    ],
  ],
  plugins: [
    '@babel/plugin-transform-private-methods',
  ],
  env: {
    test: {
      presets: [
        [
          'next/babel',
          {
            'preset-react': {
              runtime: 'automatic',
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-transform-private-methods',
      ],
    },
  },
};