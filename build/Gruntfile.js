/*eslint-env node*/
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            vega: {
                expand: true,
                flatten: true,
                src: 'node_modules/vega-lib/build/vega.js',
                dest: '../src/plugin/iframe_root/modules/vendor/vega'
            },
            d3: {
                expand: true,
                flatten: true,
                src: 'node_modules/d3/dist/d3.js',
                dest: '../src/plugin/iframe_root/modules/vendor/d3'
            },
            dagre: {
                expand: true,
                flatten: true,
                src: 'node_modules/dagre/dist/dagre.js',
                dest: '../src/plugin/iframe_root/modules/vendor/dagre'
            },
            'dagre-d3': {
                expand: true,
                flatten: true,
                src: 'node_modules/dagre-d3/dist/dagre-d3.js',
                dest: '../src/plugin/iframe_root/modules/vendor/dagre-d3'
            },
            'pure-uuid': {
                expand: true,
                flatten: true,
                src: 'node_modules/pure-uuid/uuid',
                dest: '../src/plugin/iframe_root/modules/vendor/pure-uuid'
            }
        },
        clean: {
            options: {
                force: true
            },
            vendor: '../src/plugin/iframe_root/modules/vendor/*',
            bower: './bower_components/',
            npm: './node_modules/'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
};