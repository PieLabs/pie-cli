import { SupportInfo } from '../support-info';

let config: SupportInfo = {
  npmDependencies: {
    'less-loader': '^2.2.3'
  },
  webpackLoaders: () => [
    {
      test: /\.less$/,
      loader: "style-loader!css-loader!less-loader"
    }
  ]
};

export default config;

