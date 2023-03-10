module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'object-shorthand': ['error'],
    'object-curly-spacing': ['error', 'always'],
    'arrow-parens': ['error', 'always'],
    'brace-style': ['off', 'off'],
    'id-blacklist': 'off',
    'id-match': 'off',
    'linebreak-style': 'off',
    'new-parens': 'off',
    'newline-per-chained-call': 'off',
    'no-extra-semi': 'off',
    'no-irregular-whitespace': 'off',
    'no-trailing-spaces': [
      'error',
      { ignoreComments: true, skipBlankLines: true },
    ],
    'no-underscore-dangle': 'off',
    'space-in-parens': ['off', 'never'],
    quotes: [
      'error',
      'single',
      { allowTemplateLiterals: true, avoidEscape: true },
    ],
    'no-console': ['warn'],
    curly: ['error', 'multi-line'],
    'no-useless-constructor': ['off'],
    'comma-dangle': [
      'error',
      {
        objects: 'always-multiline',
        arrays: 'always-multiline',
        functions: 'never',
        imports: 'always-multiline',
        exports: 'always-multiline',
      },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-arrow-callback': ['error'],
    'no-shadow': ['off'],
    'prefer-const': ['error', { destructuring: 'all' }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    '@typescript-eslint/explicit-member-accessibility': [
      'off',
      { accessibility: 'explicit' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/unified-signatures': 'off',
    '@typescript-eslint/no-useless-constructor': ['off'],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/prefer-optional-chain': ['warn'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { ignoreRestSiblings: true },
    ],
    '@typescript-eslint/ban-types': [
      'error',
      { types: { object: false }, extendDefaults: true },
    ],

    '@typescript-eslint/naming-convention': [
      'off',
      {
        selector: 'default',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'variable',
        modifiers: ['const'],
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'memberLike',
        modifiers: ['protected'],
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'memberLike',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'property',
        modifiers: ['static'],
        format: null,
      },
      {
        selector: 'parameterProperty',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'enumMember',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'objectLiteralProperty',
        format: null,
      },
    ],
    '@typescript-eslint/typedef': [
      'error',
      {
        arrowParameter: false,
        memberVariableDeclaration: false,
        parameter: false,
        propertyDeclaration: true,
      },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'off',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      },
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
      },
    ],
    'import/newline-after-import': ['error'],
    '@typescript-eslint/no-magic-numbers': [
      'error',
      { ignore: [0, 1], ignoreArrayIndexes: true, ignoreTypeIndexes: true },
    ],
    '@typescript-eslint/no-explicit-any': ['error'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
        disallowTypeAnnotations: false,
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/no-magic-numbers': 'off',
      },
    },
  ],
};
