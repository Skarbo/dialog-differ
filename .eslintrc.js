module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: 'standard',
  // add your custom rules here
  rules: {
    'no-mixed-operators': 'off',
    'brace-style': ['error', 'stroustrup'],
    'strict': ['error', 'never'],
    'comma-dangle': ['error', 'only-multiline']
  }
}
