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
    },
  },
};