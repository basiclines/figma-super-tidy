const secrets = require('./secrets.json')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin')
const path = require('path')

if (process.env.DESIGN_TOOL === 'figma') {
	design_tool_dist = 'figma/dist'
	design_tool_root = 'figma'
} else if (process.env.DESIGN_TOOL === 'penpot') {
	design_tool_dist = 'penpot/dist'
	design_tool_root = 'penpot'
} else {
	console.error('Invalid design tool. Please set the mode to figma or penpot.')
	process.exit(1)
}

module.exports = (env, argv) => ({
	mode: argv.mode === 'production' ? 'production' : 'development',

	// This is necessary because Figma's 'eval' works differently than normal eval
	devtool: argv.mode === 'production' ? false : 'inline-source-map',

	entry: {
		ui: './src/App.js', // The entry point for your UI code
		core: './src/Core.js', // The entry point for your plugin code
	},

	module: {
		rules: [
			// Enables including CSS by doing "import './file.css'" in your JavaScript code
			{ 
				test: /\.css$/, 
				use: [
					'style-loader', 
					{
						loader: 'css-loader',
						options: {
							// Disable URL processing to avoid issues with data URLs
							url: false,
							// Handle imports properly
							import: true,
						},
					}
				] 
			},

			// Handle images and assets
			{ 
				test: /\.(png|jpg|gif|webp|svg)$/, 
				type: 'asset/inline' // Webpack 5 way to inline assets
			},

			// JavaScript/ES6+ processing
			{ 
				test: /\.js$/, 
				exclude: /node_modules/, 
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},

	// Webpack tries these extensions for you if you omit the extension like "import './file'"
	resolve: {
		extensions: ['.js'],
		alias: {
			'@': path.resolve(__dirname, './'),
			src: path.resolve(__dirname, 'src/'),
			leo: path.resolve(__dirname, 'node_modules/@basiclines/leo/dist/'),
		}
	},

	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, design_tool_dist), // Compile into a folder called "dist"
		clean: true, // Clean output directory before build
		environment: {
			// Ensure compatibility with older environments
			arrowFunction: false,
			const: false,
			destructuring: false,
			forOf: false,
			module: false,
		}
	},

	// Modern webpack 5 optimizations
	optimization: {
		// Enable tree shaking for better bundle size
		usedExports: true,
		sideEffects: false,
		// Disable code splitting for Figma plugin compatibility
		splitChunks: false,
	},

	// Tells Webpack to generate "ui.html" and to inline "ui.js" into it
	plugins: [
		new webpack.DefinePlugin({
			'WP_ENV': JSON.stringify(process.env.NODE_ENV),
			'WP_AMPLITUDE_KEY': JSON.stringify(secrets.AMPLITUDE_KEY),
			'WP_GUMROAD_PRODUCT_ID': JSON.stringify(secrets.GUMROAD_PRODUCT_ID),
			'WP_DESIGN_TOOL': JSON.stringify(process.env.DESIGN_TOOL),
			// Define globals for Figma plugin environment
			'self': 'globalThis',
			'global': 'globalThis',
		}),
		new HtmlWebpackPlugin({
			templateContent: `<root-ui></root-ui>`,
			filename: 'index.html',
			chunks: ['ui'],
		}),
		new HtmlInlineScriptPlugin()
	]
})
