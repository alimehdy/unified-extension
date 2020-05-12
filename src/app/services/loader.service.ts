import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private renderer: Renderer2;
  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  toggleLoader(show: boolean) {
    const loaderElem = document.getElementById('app-loader');
    if (loaderElem) {
      if (show) {
        this.renderer.addClass(loaderElem, 'show-loader');
      } else {
        this.renderer.removeClass(loaderElem, 'show-loader');
      }
    }
  }

  showLoader() {
    this.toggleLoader(true);
  }

  hideLoader() {
    this.toggleLoader(false);
  }
}
