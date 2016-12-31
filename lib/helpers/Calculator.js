'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _measureTextWidth = require('../helpers/measureTextWidth');

var _measureTextWidth2 = _interopRequireDefault(_measureTextWidth);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Calculator = function (_EventEmitter) {
  (0, _inherits3.default)(Calculator, _EventEmitter);

  function Calculator() {
    var _ref;

    (0, _classCallCheck3.default)(this, Calculator);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = (0, _possibleConstructorReturn3.default)(this, (_ref = Calculator.__proto__ || (0, _getPrototypeOf2.default)(Calculator)).call.apply(_ref, [this].concat(args)));

    _this.width = 0;
    _this.paddingLeft = 0;
    _this.start = 0;
    _this.min = 0;
    _this.max = 0;
    _this.offsetMinRatio = 0;
    _this.offsetMaxRatio = 0;
    _this.timeToPixel = 0;
    return _this;
  }

  (0, _createClass3.default)(Calculator, [{
    key: 'forceUpdate',
    value: function forceUpdate() {
      this.emit('change', this);
    }
  }, {
    key: 'update',
    value: function update(props) {
      for (var key in {
        width: true,
        paddingLeft: true,
        start: true,
        min: true,
        max: true,
        offsetMinRatio: true,
        offsetMaxRatio: true
      }) {
        if (props.hasOwnProperty(key)) {
          this[key] = props[key];
        }
      }

      var _getOffsetRange = this.getOffsetRange(),
          offsetMin = _getOffsetRange.min,
          offsetMax = _getOffsetRange.max;

      this.timeToPixel = this.width / (offsetMax - offsetMin);

      this.emit('change', this);
    }
  }, {
    key: 'getPosition',
    value: function getPosition(time) {
      var _getOffsetRange2 = this.getOffsetRange(),
          offsetMin = _getOffsetRange2.min;

      return Math.round((time - offsetMin) * this.timeToPixel + this.paddingLeft);
    }
  }, {
    key: 'formatValue',
    value: function formatValue(value, precision) {
      return (value - this.start).toFixed(precision) + ' ms';
    }
  }, {
    key: 'getRange',
    value: function getRange() {
      var min = this.min,
          max = this.max;


      return { min: min, max: max };
    }
  }, {
    key: 'getOffsetLeft',
    value: function getOffsetLeft() {
      var min = this.min,
          width = this.width;

      var _getOffsetRange3 = this.getOffsetRange(),
          offsetMin = _getOffsetRange3.min,
          offsetMax = _getOffsetRange3.max;

      return -(offsetMin - min) / (offsetMax - offsetMin) * width;
    }
  }, {
    key: 'getOffsetRange',
    value: function getOffsetRange() {
      var _getRange = this.getRange(),
          min = _getRange.min,
          max = _getRange.max;

      var range = max - min;

      var currMin = min + this.offsetMinRatio * range;
      var currMax = max - this.offsetMaxRatio * range;

      return { min: currMin, max: currMax };
    }
  }, {
    key: 'getDividerOffsets',
    value: function getDividerOffsets() {
      var freeZoneAtLeft = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var paddingLeft = this.paddingLeft,
          start = this.start;

      var _getOffsetRange4 = this.getOffsetRange(),
          offsetRangeMax = _getOffsetRange4.max,
          offsetRangeMin = _getOffsetRange4.min;

      var offsetRange = offsetRangeMax - offsetRangeMin;

      var clientWidth = this.getPosition(offsetRangeMax);
      var pixelsPerTime = clientWidth / offsetRange;

      var dividersCount = clientWidth / Calculator.MinGridSlicePx;
      var gridSliceTime = offsetRange / dividersCount;

      // Align gridSliceTime to a nearest round value.
      // We allow spans that fit into the formula: span = (1|2|5)x10^n,
      // e.g.: ...  .1  .2  .5  1  2  5  10  20  50  ...
      // After a span has been chosen make grid lines at multiples of the span.

      var logGridSliceTime = Math.ceil(Math.log(gridSliceTime) / Math.LN10);
      gridSliceTime = Math.pow(10, logGridSliceTime);

      if (gridSliceTime * pixelsPerTime >= 5 * Calculator.MinGridSlicePx) {
        gridSliceTime = gridSliceTime / 5;
      }

      if (gridSliceTime * pixelsPerTime >= 2 * Calculator.MinGridSlicePx) {
        gridSliceTime = gridSliceTime / 2;
      }

      var leftBoundaryTime = offsetRangeMin - paddingLeft / pixelsPerTime;
      var firstDividerTime = Math.ceil((leftBoundaryTime - start) / gridSliceTime) * gridSliceTime + start;
      var lastDividerTime = offsetRangeMax;

      // Add some extra space past the right boundary as the rightmost divider label text
      // may be partially shown rather than just pop up when a new rightmost divider gets into the view.
      lastDividerTime += Calculator.MinGridSlicePx / pixelsPerTime;
      dividersCount = Math.ceil((lastDividerTime - firstDividerTime) / gridSliceTime);

      if (!gridSliceTime) {
        dividersCount = 0;
      }

      var offsets = [];
      for (var i = 0; i < dividersCount; ++i) {
        var time = firstDividerTime + gridSliceTime * i;
        if (this.getPosition(time) < freeZoneAtLeft) {
          continue;
        }

        offsets.push(time);
      }

      return { offsets: offsets, precision: Math.max(0, -Math.floor(Math.log(gridSliceTime * 1.01) / Math.LN10)) };
    }
  }, {
    key: 'drawGrid',
    value: function drawGrid(context, styles, height, paddingTop, headerHeight, freeZoneAtLeft) {
      context.save();

      var width = this.width;

      var dividersData = this.getDividerOffsets();
      var dividerOffsets = dividersData.offsets;
      var precision = dividersData.precision;

      if (headerHeight) {
        context.fillStyle = styles.stackGrid.headerBackgroundFillStyle;
        context.fillRect(0, 0, width, headerHeight);
      }

      context.fillStyle = styles.stackGrid.headerTextFillStyle;
      context.strokeStyle = styles.stackGrid.gridStrokeStyle;
      context.textBaseline = 'hanging';
      context.font = styles.stackGrid.font;
      context.lineWidth = styles.stackGrid.gridLineWidth;

      context.translate(0.5, 0.5);

      var paddingRight = 4;

      for (var i = 0; i < dividerOffsets.length; ++i) {
        var time = dividerOffsets[i];
        var position = this.getPosition(time);
        context.moveTo(position, 0);
        context.lineTo(position, height);

        if (!headerHeight) {
          continue;
        }

        var text = this.formatValue(time, precision);
        var textWidth = (0, _measureTextWidth2.default)(context, text);
        var textPosition = position - textWidth - paddingRight;
        if (!freeZoneAtLeft || freeZoneAtLeft < textPosition) {
          context.fillText(text, textPosition, paddingTop);
        }
      }

      context.stroke();
      context.restore();
      context.beginPath();
    }
  }]);
  return Calculator;
}(_eventemitter2.default);

Calculator.MinGridSlicePx = 64;
exports.default = Calculator;
