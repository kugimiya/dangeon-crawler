const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.html',
  devServer: {
    open: true,
    liveReload: true,
    hot: true,
    port: 3000,

    client: {
      progress: true,
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  entry: {
    main: path.join(__dirname, 'src', 'index.ts'),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(m?js|ts)$/,
        exclude: /(node_modules)/,
        use: [`swc-loader`]
      }
    ]
  },
  resolve: {
    extensions: [`.js`, `.ts`],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      hash: false,
      template:  path.join(__dirname, 'src', 'static', 'index.html'),
      filename: 'index.html',
    })
  ]
}
