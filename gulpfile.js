const gulp = require('gulp'),
  babel = require('gulp-babel'),
  gutil = require('gulp-util'),
  eslint = require('gulp-eslint');

gulp.task('pug', () => {
  return gulp.src('src/**/*.pug')
    .pipe(gulp.dest('lib'));
});

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .on('error', function (e) {
      console.log(e.stack);
      gutil.log('babel error', e.stack);
      this.emit('end');
    })
    .pipe(gulp.dest('lib'))
});

gulp.task('watch-babel', () => {
  return gulp.watch('src/**/*.js', ['babel']);
});

gulp.task('watch-pug', () => {
  return gulp.watch('src/**/*.pug', ['pug']);
});

gulp.task('lint', () => {
  return gulp.src(['src/**/*.js','!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('build', ['lint', 'pug', 'babel']);

gulp.task('dev', ['pug', 'babel', 'watch-pug', 'watch-babel']);
