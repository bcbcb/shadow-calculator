var gulp = require('gulp');
var concat = require('gulp-concat');
var livereload = require('gulp-livereload');

gulp.task('scripts', function() {
  gulp.src('./client/app/**/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('*.*', ['less']);
});
