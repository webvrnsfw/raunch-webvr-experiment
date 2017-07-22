import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-es';

export default {
	entry: 'src/index.js',
	format: 'iife',
	context: 'window',
	plugins: [ 
		resolve(), 
		commonjs({
			include: [
				'node_modules/three/examples/js/libs/stats.min.js',
				'node_modules/raunch/dist/raunch-webbluetooth.js',
			],
			namedExports: {
				'./node_modules/raunch/dist/raunch-webbluetooth.js': ['RaunchWebBluetooth']
			}
		}),
		uglify({}, minify),
	],
	dest: 'bundle.js'
};
