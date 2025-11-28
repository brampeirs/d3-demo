import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TimeRange, TIME_RANGE_OPTIONS } from '../area-chart/area-chart.model';

@Component({
  selector: 'app-range-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './range-picker.component.html',
  styleUrl: './range-picker.component.css',
})
export class RangePickerComponent {
  /** Currently selected time range */
  readonly selectedRange = input<TimeRange>('ALL');

  /** Emits when a range button is clicked */
  readonly rangeChange = output<TimeRange>();

  /** Available time range options */
  readonly options = TIME_RANGE_OPTIONS;

  onSelect(range: TimeRange): void {
    this.rangeChange.emit(range);
  }
}
