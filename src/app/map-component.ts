import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import * as maplibregl from 'maplibre-gl';

/**
 * Thin wrapper around a maplibregl.Map instance.
 * We own the map lifecycle: creation, resize, destruction (ADR-0001).
 */
@Component({
  selector: 'app-map',
  template: `<div #map class="map"></div>`,
  styles: `
    .map {
      position: absolute;
      inset: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  /** Mapbox style URL, e.g. mapbox://styles/mapbox/streets-v12 */
  readonly style = input.required<string>();
  readonly center = input<[number, number]>([103.7665, 1.3888]);
  readonly zoom = input<number>(13.5);

  /** Emits the ready maplibregl.Map exactly once. */
  readonly mapReady = output<maplibregl.Map>();

  private map: maplibregl.Map | null = null;

  constructor(@Inject(ElementRef) private el: ElementRef<HTMLDivElement>) {}

  ngAfterViewInit() {
    this.map = new maplibregl.Map({
      container: this.el.nativeElement,
      style: this.style(),
      center: this.center(),
      zoom: this.zoom(),
    });
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.on('load', () => this.mapReady.emit(this.map!));
  }

  ngOnDestroy() {
    this.map?.remove();
    this.map = null;
  }
}
