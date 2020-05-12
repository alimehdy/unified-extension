import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';


const dhisUser = 'Ali.Mehdy';
const dhisPassword = 'LBN22v10+LBN22v10';

const onaUser = 'im_officer_leb';
const onaPassword = 'LBNIM22v10';

let dhisHttpOptions;
let onaHttpOptions;

if (isDevMode()) {
  dhisHttpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(dhisUser + ':' + dhisPassword),
      'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
      'access-control-allow-credentials': 'true'

    })
  };
  onaHttpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(onaUser + ':' + onaPassword),
    })
  };
  // onaHttpOptions = {
  //   headers: new HttpHeaders({
  //     'Content-Type':  'application/json',
  //     Authorization: 'Basic ' + btoa(onaUser + ':' + onaPassword),
  //     'Access-Control-Allow-Origin': '*',
  //     // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
  //     'access-control-allow-credentials': 'true'
  //   })
  // };
} else {
  dhisHttpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
      'access-control-allow-credentials': 'true'

    })
  };
  onaHttpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
      'access-control-allow-credentials': 'true'

    })
  };
}
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getData(url, orgApi) {
    const httpOptions = orgApi === 'ona' ? onaHttpOptions : dhisHttpOptions;
    return this.http.get(url, httpOptions).pipe();
  }
  getDataWithUsername(url, orgApi) {
    const username = orgApi === 'ona' ? onaUser : '';
    const httpOptions = orgApi === 'ona' ? onaHttpOptions : dhisHttpOptions;
    return this.http.get(url + 'u=' + username, httpOptions).pipe(timeout(30000));
  }
  postData(url, orgApi, data, timeoutMillis) {
    const httpOptions = orgApi === 'ona' ? onaHttpOptions : dhisHttpOptions;
    return this.http.post(url, data, httpOptions).pipe(timeout(timeoutMillis), catchError(this.connError));
  }

  putData(url, orgApi, data, timeoutMillis) {
    const httpOptions = orgApi === 'ona' ? onaHttpOptions : dhisHttpOptions;
    return this.http.put(url, data, httpOptions).pipe(timeout(timeoutMillis), catchError(this.connError));
  }

  postEnrollment(url, orgApi, data) {
    const httpOptions = orgApi === 'ona' ? onaHttpOptions : dhisHttpOptions;
    return this.http.post(url, data, httpOptions);
  }

  connError() {
    return throwError('Connection Error');
  }
}
