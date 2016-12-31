import { renderSimpleFlameChart, unrenderSimpleFlameChart } from '../src';
import * as HSLColorGenerator from '../src/helpers/HSLColorGenerator';
import './SimpleFlameChart.less';

global.HSLColorGenerator = HSLColorGenerator;
global.renderSimpleFlameChart = renderSimpleFlameChart;
global.unrenderSimpleFlameChart = unrenderSimpleFlameChart;