const browserify = require('browserify');
const fs = require('fs');

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

browserify('src/frontend', {
  standalone: 'CodeCut'
})
  // .transform('babelify', { presets: ['es2015'] })
  // .transform({ global: true }, 'uglifyify')
  .bundle()
  .pipe(fs.createWriteStream('dist/codecut.js'));
