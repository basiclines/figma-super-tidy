module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          // Support modern browsers and Node.js
          browsers: ['> 1%', 'last 2 versions', 'not dead'],
          node: 'current'
        },
        // Use modern JavaScript features
        useBuiltIns: 'usage',
        corejs: 3,
        // Enable modern syntax
        modules: false, // Let webpack handle modules
        debug: false,
        // Include more modern features
        include: [
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-logical-assignment-operators'
        ]
      }
    ]
  ],
  plugins: [
    // Support for class properties and private methods (using assumptions instead of loose)
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-transform-private-property-in-object',
    // Support for decorators (if needed)
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // Modern JavaScript operators
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-logical-assignment-operators'
  ],
  // Enable modern JavaScript features
  assumptions: {
    setPublicClassFields: true,
    privateFieldsAsSymbols: true
  }
};
