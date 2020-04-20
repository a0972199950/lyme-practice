const path = require('path')
// const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin')

module.exports = {
  devServer: {
    disableHostCheck: true
  },
  
  entry: {
    sw: './src/sw.ts',
    app: './src/app.ts'
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist')
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      excludeAssets: [/sw.js/]
    }),

    new HtmlWebpackExcludeAssetsPlugin()
  ]
}