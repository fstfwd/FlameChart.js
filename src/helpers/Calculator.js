import measureTextWidth from '../helpers/measureTextWidth';
import EventEmitter from 'eventemitter3';

export default class Calculator extends EventEmitter {
  static MinGridSlicePx = 64;

  width = 0;
  paddingLeft = 0;
  start = 0;
  min = 0;
  max = 0;
  offsetMinRatio = 0;
  offsetMaxRatio = 0;
  timeToPixel = 0;

  constructor(...args) {
    super(...args);
  }

  forceUpdate() {
    this.emit('change', this);
  }

  update(props) {
    for (const key in {
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

    const { min: offsetMin, max: offsetMax } = this.getOffsetRange();

    this.timeToPixel = this.width / (offsetMax - offsetMin);

    this.emit('change', this);
  }

  getPosition(time) {
    const { min: offsetMin } = this.getOffsetRange();

    return Math.round((time - offsetMin) * this.timeToPixel + this.paddingLeft);
  }

  formatValue(value, precision) {
    return ((value - this.start)).toFixed(precision) + ' ms';
  }

  getRange() {
    const { min, max } = this;

    return { min, max };
  }

  getOffsetLeft() {
    const { min, width } = this;
    const { min: offsetMin, max: offsetMax } = this.getOffsetRange();

    return -(offsetMin - min) / (offsetMax - offsetMin) * width;
  }

  getOffsetRange() {
    const { min, max } = this.getRange();
    const range = max - min;

    const currMin = min + this.offsetMinRatio * range;
    const currMax = max - this.offsetMaxRatio * range;

    return { min: currMin, max: currMax };
  }

  getDividerOffsets(freeZoneAtLeft = 0) {
    const { paddingLeft, start } = this;
    const { max: offsetRangeMax, min: offsetRangeMin } = this.getOffsetRange();
    const offsetRange = offsetRangeMax - offsetRangeMin;

    const clientWidth = this.getPosition(offsetRangeMax);
    const pixelsPerTime = clientWidth / offsetRange;

    let dividersCount = clientWidth / Calculator.MinGridSlicePx;
    let gridSliceTime = offsetRange / dividersCount;

    // Align gridSliceTime to a nearest round value.
    // We allow spans that fit into the formula: span = (1|2|5)x10^n,
    // e.g.: ...  .1  .2  .5  1  2  5  10  20  50  ...
    // After a span has been chosen make grid lines at multiples of the span.

    const logGridSliceTime = Math.ceil(Math.log(gridSliceTime) / Math.LN10);
    gridSliceTime = Math.pow(10, logGridSliceTime);

    if (gridSliceTime * pixelsPerTime >= 5 * Calculator.MinGridSlicePx) {
      gridSliceTime = gridSliceTime / 5;
    }

    if (gridSliceTime * pixelsPerTime >= 2 * Calculator.MinGridSlicePx) {
      gridSliceTime = gridSliceTime / 2;
    }

    const leftBoundaryTime = offsetRangeMin - paddingLeft / pixelsPerTime;
    const firstDividerTime =
      Math.ceil((leftBoundaryTime - start) / gridSliceTime) * gridSliceTime + start;
    let lastDividerTime = offsetRangeMax;

    // Add some extra space past the right boundary as the rightmost divider label text
    // may be partially shown rather than just pop up when a new rightmost divider gets into the view.
    lastDividerTime += Calculator.MinGridSlicePx / pixelsPerTime;
    dividersCount = Math.ceil((lastDividerTime - firstDividerTime) / gridSliceTime);

    if (!gridSliceTime) {
      dividersCount = 0;
    }

    const offsets = [];
    for (let i = 0; i < dividersCount; ++i) {
      let time = firstDividerTime + gridSliceTime * i;
      if (this.getPosition(time) < freeZoneAtLeft) {
        continue;
      }

      offsets.push(time);
    }

    return { offsets: offsets, precision: Math.max(0, -Math.floor(Math.log(gridSliceTime * 1.01) / Math.LN10)) };
  }

  drawGrid(context, styles, height, paddingTop, headerHeight, freeZoneAtLeft) {
    context.save();

    const { width } = this;
    const dividersData = this.getDividerOffsets();
    const dividerOffsets = dividersData.offsets;
    const precision = dividersData.precision;

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

    const paddingRight = 4;

    for (let i = 0; i < dividerOffsets.length; ++i) {
      const time = dividerOffsets[i];
      const position = this.getPosition(time);
      context.moveTo(position, 0);
      context.lineTo(position, height);

      if (!headerHeight) {
        continue;
      }

      const text = this.formatValue(time, precision);
      const textWidth = measureTextWidth(context, text);
      const textPosition = position - textWidth - paddingRight;
      if (!freeZoneAtLeft || freeZoneAtLeft < textPosition) {
        context.fillText(text, textPosition, paddingTop);
      }
    }

    context.stroke();
    context.restore();
    context.beginPath();
  }
}
