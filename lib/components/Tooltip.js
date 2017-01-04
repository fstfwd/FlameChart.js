'use strict';

Object.defineProperty(exports, "__esModule", {
       value: true
});
exports.default = Tooltip;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _radium = require('radium');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Tooltip(_ref) {
       var entry = _ref.entry,
           styles = _ref.styles,
           highlightedTotal = _ref.highlightedTotal,
           selectedTotal = _ref.selectedTotal;

       return _react2.default.createElement(
              _radium.StyleRoot,
              null,
              _react2.default.createElement(_radium.Style, { scopeSelector: '.tooltip',
                     rules: styles.tooltip }),
              _react2.default.createElement(_radium.Style, { scopeSelector: '.tooltipName',
                     rules: styles.tooltipName }),
              _react2.default.createElement(_radium.Style, { scopeSelector: '.tooltipTime',
                     rules: styles.tooltipTime }),
              _react2.default.createElement(_radium.Style, { scopeSelector: '.tooltipHighlighted',
                     rules: styles.tooltipHighlighted }),
              _react2.default.createElement(_radium.Style, { scopeSelector: '.tooltipSelected',
                     rules: styles.tooltipSelected }),
              _react2.default.createElement(
                     'div',
                     { className: 'tooltip' },
                     _react2.default.createElement(
                            'div',
                            { className: 'tooltipTime' },
                            (entry.end - entry.start).toFixed(2),
                            ' ms'
                     ),
                     _react2.default.createElement(
                            'div',
                            { className: 'tooltipName' },
                            entry.name
                     ),
                     entry.highlighted && _react2.default.createElement(
                            'div',
                            { className: 'tooltipHighlighted' },
                            'Highlight(',
                            entry.highlighted,
                            ' of ',
                            highlightedTotal,
                            ')'
                     ),
                     entry.selected && _react2.default.createElement(
                            'div',
                            { className: 'tooltipSelected' },
                            'Selected(',
                            entry.selected,
                            ' of ',
                            selectedTotal,
                            ')'
                     )
              )
       );
}
