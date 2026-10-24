export default {
  '*.{js,jsx,ts,tsx}': (files) =>
    'eslint --fix --max-warnings=0 --no-warn-ignored ' + files.join(' '),
}
