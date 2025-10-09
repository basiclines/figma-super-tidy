const secrets = require('./secrets.json')
const webpack = require('webpack')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

if (process.env.DESIGN_TOOL === 'figma') {
	design_tool_dist = 'figma/dist'
} else if (process.env.DESIGN_TOOL === 'penpot') {
	design_tool_dist = 'penpot/dist'
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
			// Enables including CSS by doing "import './file.css'" in your TypeScript code
			{ test: /\.css$/, loader: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },

			{ test: /\.(png|jpg|gif|webp)$/, loader: [{ loader: 'url-loader' }] },

			{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
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
	},

	// Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
	plugins: [
		new webpack.DefinePlugin({
			'WP_ENV': JSON.stringify(process.env.NODE_ENV),
			'WP_AMPLITUDE_KEY': JSON.stringify(secrets.AMPLITUDE_KEY),
			'WP_GUMROAD_PRODUCT_ID': JSON.stringify(secrets.GUMROAD_PRODUCT_ID),
			'WP_DESIGN_TOOL': JSON.stringify(process.env.DESIGN_TOOL),
		}),
		new HtmlWebpackPlugin({
			templateContent: `<root-ui></root-ui>`,
			filename: 'ui.html',
			inlineSource: '.(js)$',
			chunks: ['ui'],
		}),
		new HtmlWebpackInlineSourcePlugin()
	]
})
