import React from 'react';
import { Style, StyleRoot } from 'radium';

export default  function Tooltip({ entry, styles, highlightedTotal, selectedTotal }) {
  return (
    <StyleRoot>
      <Style scopeSelector='.tooltip'
             rules={styles.tooltip}/>
      <Style scopeSelector='.tooltipName'
             rules={styles.tooltipName}/>
      <Style scopeSelector='.tooltipTime'
             rules={styles.tooltipTime}/>
      <Style scopeSelector='.tooltipHighlighted'
             rules={styles.tooltipHighlighted}/>
      <Style scopeSelector='.tooltipSelected'
             rules={styles.tooltipSelected}/>
      <div className='tooltip'>
        <div className='tooltipTime'>{(entry.end - entry.start).toFixed(2)} ms</div>
        <div className='tooltipName'>{entry.name}</div>
        { entry.highlighted &&
        <div className='tooltipHighlighted'>Highlight({entry.highlighted} of {highlightedTotal})</div> }
        { entry.selected &&
        <div className='tooltipSelected'>Selected({entry.selected} of {selectedTotal})</div> }
      </div>
    </StyleRoot>
  );
}
