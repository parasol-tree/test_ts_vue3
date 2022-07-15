'use strict'

const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const productionGzipExtensions = ['js', 'css']
const resolve = function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  // transpileDependencies: true,
  filenameHashing: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/', // 项目没有部署在 网站根目录下, 好烦
  productionSourceMap: false,
  css: {
    extract: process.env.NODE_ENV === 'production', // 是否将组件中的 CSS 提取至一个独立的 CSS 文件中
    sourceMap: process.env.NODE_ENV === 'development' // development 环境 显示 cssSourceMap
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
        // _views: resolve('src/views'),
        // _api: resolve('src/api'),
        // _js: resolve('src/assets/js'),
        // _img: resolve('src/assets/img'),
        // _css: resolve('src/assets/css'),
        // _components: resolve('src/components')
      },
      extensions: ['.ts', '.tsx', '.js']
    },
    plugins: []
  },
  chainWebpack: config => {
    console.log('NODE_ENV 是: ', process.env.NODE_ENV)
    console.log('ENV 是: ', process.env.ENV)
    console.log('VUE_APP_BASE_API 是: ', process.env.VUE_APP_BASE_API)
    console.log('VUE_APP_BASE_URL 是: ', process.env.VUE_APP_BASE_URL)

    config.plugins.delete('prefetch')

    // const entry = config.entry('app')
    // entry.add('babel-polyfill').end()
    // entry.add('classlist-polyfill').end()

    config.when(['production', 'staging'].includes(process.env.ENV), config => {
      console.log('开始拆分打包。。。。。。。')

      config.output.filename('js/[name].[contenthash].min.js').end()
      config.output.chunkFilename('js/[name].[contenthash].min.js').end()

      config.plugin('CompressionWebpackPlugin')
        .use(CompressionWebpackPlugin, [
          {
            // filename: '[path].gz[query]',
            algorithm: 'gzip',
            test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
            threshold: 10240,
            minRatio: 0.8,
            deleteOriginalAssets: false
          }
        ])

      config.plugin('ScriptExtHtmlWebpackPlugin').after('html')
        .use('script-ext-html-webpack-plugin', [{
          // `runtime` must same as runtimeChunk name. default is `runtime`
          inline: /runtime\..*\.js$/
        }])
        .end()

      config.optimization.runtimeChunk('single').end()
      config.optimization.removeEmptyChunks(true).end()
      config.optimization.runtimeChunk(false).end()
      config.optimization.minimize(true).end()
      config.optimization.minimizer().use(TerserPlugin, [{ parallel: true }]).end()

      config
        .optimization.splitChunks({
          chunks: 'all',
          cacheGroups: {
            libs: {
              name: 'chunk-libs',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'initial',
              reuseExistingChunk: true
            },
            vue: {
              name: 'chunk-vue',
              priority: 20,
              test: /[\\/]node_modules[\\/]_?vue(.*)/,
              reuseExistingChunk: true
            },
            // elementUI: {
            //   name: 'chunk-elementUI', // split elementUI into a single package
            //   priority: 30, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            //   test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
            // },
            commons: {
              name: 'chunk-components',
              test: resolve('src/components'), // can customize your rules
              minChunks: 1, //  minimum common number
              priority: 40,
              reuseExistingChunk: true
            }
          }
        })
    }, config => {
      config.devtool('eval-source-map')
    })
  },
  devServer: {
    allowedHosts: 'all',
    compress: false,
    // host: '0.0.0.0',
    // host: 'local-ip',
    // host: 'localhost',
    client: {
      overlay: {
        warnings: process.env.NODE_ENV === 'development',
        errors: process.env.NODE_ENV === 'development'
      },
      progress: true,
      webSocketTransport: 'ws'
    },
    webSocketServer: 'ws',
    // https: true,
    https: false,
    hot: true,
    open: true,
    static: false,
    proxy: {
      '/channels': {
        target: 'https://qas-eshopapi-video.dp1212.com', // 测试环境
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '/channels': '/channels'
        }
      }
    }
    // before: app => {}
  }
}
