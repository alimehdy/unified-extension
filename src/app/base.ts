import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from './services/api.service';
import { GlobalVarService } from './services/global-var.service';
import { LoaderService } from './services/loader.service';

export abstract class BaseClass {
    fb: FormBuilder;
    router: Router;
    globalVar: GlobalVarService;
    api: ApiService;
    loader: LoaderService;
    constructor(private injectorObj: Injector) {
        this.router = this.injectorObj.get(Router);
        this.fb = this.injectorObj.get(FormBuilder);
        this.globalVar = this.injectorObj.get(GlobalVarService);
        this.api = this.injectorObj.get(ApiService);
        this.loader = this.injectorObj.get(LoaderService);
    }
}
