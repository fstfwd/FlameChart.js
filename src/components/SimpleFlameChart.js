import React from 'react';
import ReactDOM from 'react-dom';
import Dimensions from 'react-dimensions';
import FlameChart, { Stack } from './FlameChart';
import { Light, Dark } from './Themes';
import { Warm } from '../helpers/HSLColorGenerator';
import _ from 'lodash';
import { map, filter } from 'lodash/fp';
import Checkbox from 'rc-checkbox';
import Matcher from 'matcher';

export class SimpleStack extends React.Component {
  static SEARCH_INPUT_DEBOUNCE = 500;

  static defaultProps = {
    name: null,
    types: [],
    getTimingColor: null,
    onTimingClick: null,
    isTimingSelected: null
  };

  render() {
    throw Error('Should never render!');
  }
}

export class SimpleFlameChart extends React.Component {
  static RESIZE_DEBOUNCE_TIMEOUT = 300;

  static defaultProps = {
    theme: 'dark',
    timings: [],
    groups: []
  };

  ref = {};

  state = {
    highlighted: new WeakSet(),
    highlightCount: 0,
    query: null,
    selected: new WeakSet(),
    selectedCount: 0,
    visibility: new Map()
  };

  searchTimeout = 0;

  _getTimingColor(timing) {
    return Warm.colorForID(timing.name);
  }

  _isTimingSelected(timing) {
    return this.isTimingSelected(timing);
  }

  _onTimingClick(timing) {
    if (this.isTimingSelected(timing)) {
      this.setTimingSelected(timing, false);
      return;

    }

    this.setTimingSelected(null);
    this.setTimingSelected(timing, true);
  }

  _setGroupVisibility(name, visible) {
    const { visibility } = this.state;

    visibility.set(name, visible);

    this.setState({ visibility });
  }

  _timingContains({ name }, query) {
    return String(name).toLowerCase().indexOf(query) > -1 || Matcher.isMatch(name, query);
  }

  _performSearch(query) {
    let { timings, timingContains = this._timingContains } = this.props;
    let highlightCount = 0;

    const highlighted = new WeakSet();

    if (query != null) {
      const validatedQuery = String(query).trim().toLowerCase();

      if (validatedQuery.length > 0) {
        for (const timing of timings) {
          if (timingContains(timing, validatedQuery)) {
            highlightCount++;
            highlighted.add(timing);
          }
        }
      }
    }

    this.setState({ query, highlighted, highlightCount });
  }

  isTimingSelected(timing) {
    return timing == null ? this.state.selectedCount > 0 : this.state.selected.has(timing);
  }

  setTimingSelected(timing, select) {
    if (timing == null) {
      this.setState(() => {
        return { selected: new WeakSet(), selectedCount: 0 };
      });
    } else {
      this.setState(state => {
        let { selected, selectedCount } = state;

        if (select) {
          selected.add(timing);
          selectedCount++;
        } else if (selected.has(timing)) {
          selected.delete(timing);
          selectedCount--;
        }

        return { selected, selectedCount };
      });
    }
  }

  _handleInput(e) {
    clearTimeout(this.searchTimeout);

    const { value } = e.target;

    this.searchTimeout = setTimeout(() => {
      this._performSearch(value);
    }, SimpleStack.SEARCH_INPUT_DEBOUNCE);
  }

  render() {
    let {
      children,
      timings,
      start,
      theme
    } = this.props;

    const {
      highlighted,
      highlightCount,
      query,
      visibility
    } = this.state;

    const provider = {
      entryStartGetter: timing => timing.start,
      entryEndGetter: timing => timing.end,
      entryNameGetter: timing => timing.name,
      entryHighlightedGetter: timing => highlighted.has(timing)
    };

    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    let visibleStackCount = 0;
    let idx = 0, idx2 = 0;
    let groupVisibilityToggles = [];

    const stacks = _.flow([
      map(({ props, props: { types = [], name } }) => {
        const currTimings = _.filter(timings, timing => types.includes(timing.type));
        const currMin = _.minBy(currTimings, timing => timing.start);
        const currMax = _.maxBy(currTimings, timing => timing.end);
        const disabled = currTimings.length === 0;
        const visible = (!visibility.has(name) || visibility.get(name)) && !disabled;

        if (currMin != null) {
          min = Math.min(currMin.start, min);
        }

        if (currMax != null) {
          max = Math.max(currMax.end, max);
        }

        groupVisibilityToggles.push(
          <div className='simple-flamechart-group'
               key={idx2++}>
            <Checkbox checked={visible}
                      disabled={disabled}
                      onChange={() => this._setGroupVisibility(name, !visible)}/>
            <label style={{ textDecoration: disabled && 'line-through' }}>{name}</label>
          </div>
        );

        return { timings: currTimings, props, visible };
      }),
      filter(({ timings: { length }, visible }) => visible && length > 0 ? visibleStackCount += 1 : 0),
      map(({ timings, props: { name, getTimingColor, isTimingSelected, onTimingClick, ...props } }) => {
        return (
          <Stack key={idx++}
                 name={name}
                 timings={timings}
                 defaultHeight={1 / visibleStackCount}
                 {...provider}
                 {...props}
                 entryFillGetter={getTimingColor || ::this._getTimingColor}
                 entrySelectedGetter={isTimingSelected || ::this._isTimingSelected}
                 onEntryClick={onTimingClick || ::this._onTimingClick}/>
        );
      })])(React.Children.toArray(children));

    if (start == null) {
      start = min;
    }

    return (
      <div className={`simple-flamechart ${theme}`}
           style={{ height: '100%', width: '100%' }}>
        <div className={`simple-flamechart-bar`}>
          <div className='simple-flamechart-groups'>
            {groupVisibilityToggles}
          </div>
          <input className='simple-flamechart-search-box'
                 placeholder='Search by text or .* regex'
                 onInput={e => this._handleInput(e)}/>
          { query && <div className='simple-flamechart-search-count'>{highlightCount} results</div> }
        </div>
        <div>
          <WrappedFlameChart min={min - (min - start)}
                             max={max}
                             styles={theme === 'dark' ? Dark : Light}
                             start={start}>
            {stacks}
          </WrappedFlameChart>
        </div>
      </div>
    );
  }
}

export function renderSimpleFlameChart({
  timings = [],
  stacks = [],
  ...opts
}, element) {
  return ReactDOM.render(
    <SimpleFlameChart timings={timings}
                      {...opts}>
      {
        stacks.map((stack, i) => {
          return (
            <SimpleStack {...stack}
                         key={i}/>
          )
        })
      }
    </SimpleFlameChart>, element);
}

const WrappedFlameChart = Dimensions({
  elementResize: true,
  debounce: SimpleFlameChart.RESIZE_DEBOUNCE_TIMEOUT
})(class WrappedFlameChart extends React.PureComponent {
  render() {
    const { containerWidth, containerHeight, ...props } = this.props;
    return (
      <FlameChart {...props}
                  width={containerWidth}
                  height={containerHeight}/>
    );
  }
});

export function unrenderSimpleFlameChart(element) {
  return ReactDOM.unmountComponentAtNode(element);
}

export function injectSimpleFlameChartStyles() {
  return require('./SimpleFlameChart.less');
}

export default SimpleFlameChart;
