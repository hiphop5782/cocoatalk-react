// craco.config.js
const path = require('path');
// const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    // 여기에 원하는 설정을 추가할 수 있습니다.
    // 예를 들어, ESLint 설정을 수정하려면 다음과 같이 추가합니다.
    eslint: {
        configure: {
            rules: {
                // ESLint 규칙을 추가하거나 수정합니다.
            },
        },
    },
    webpack:{
        configure:{
            output:{
                //path:path.resolve(__dirname, '../docs'),
            },
        },
        alias:{
            '@src':path.resolve(__dirname, "src/"), 
        },
        plugins:{
            add:[
                // new CopyPlugin({
                //     patterns:[
                //         {
                //             from: 'public/images',
                //             to:'../docs/images'
                //         },
                //     ],
                // }),
            ],
        },
    },
};