module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleNameMapper: {
    '@api/(.*)': '<rootDir>/src/api/$1',
    '@screens/(.*)': '<rootDir>/src/screens/$1',
    '@navigation/(.*)': '<rootDir>/src/navigation/$1',
    '@contexts/(.*)': '<rootDir>/src/contexts/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@types/(.*)': '<rootDir>/src/types/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@react-native-.*)/)',
  ],
};
