const path = require("path");
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
let clientConfig = {
    entry: {
        background: "./src/main/ts/background.ts",
        popup: "./src/main/ts/popup.ts",
        inline: "./src/main/ts/inline.tsx"
    },
    mode: "development",
    output: {
        path: path.resolve(__dirname, "dist/"),
        filename: "js/[name].js"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".scss"]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {transpileOnly: false}
            },
            {
                test: /\.scss?$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: "css/[name].css"
        }),
        new CopyPlugin(
            [
                {from: './src/main/json', to: '.'},
                {from: './src/main/html', to: '.'},
                {from: './src/main/img', to: './img'},
            ]
        )
    ]
};
module.exports = clientConfig;