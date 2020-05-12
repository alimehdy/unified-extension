import { Component, OnInit, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseClass } from '../base';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import * as _ from 'lodash';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
import { ConnectionService } from 'ng-connection-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseClass implements OnInit {
  @ViewChild('SelectOdk', { static: false }) Select: MatSelect;

  public filteredOdks: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  public filteredPrograms: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  public filteredOrganization: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  public filteredFields: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  public filteredDataElements: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  // Various variables
  removeUnnecessaryFieldsMsg = '';
  mapDataError = '';
  odkDataMsg = '';
  tabIndex = 0;
  countOdkListCall = 1;
  countOrganizationListCall = 1;
  selectedOdkFormName = '';
  selectedProgramName = '';
  // tslint:disable-next-line: variable-name
  private _onDestroy = new Subject<void>();

  // Reactive Forms
  mainGroup: FormGroup;
  onaDataFieldsGroup: FormGroup;
  indexesForm: FormGroup;
  uploadDataForm: FormGroup;
  deMappingForm: FormGroup;
  // Loaders and div showers
  isLoading = false;
  deDivShow = false;
  showFields = false;
  showEmptyOdkMsg = false;
  showEmptyDEMsg = false;
  isConnected = true;

  // Arrays
  odkList: any[] = [];
  programList: any[] = [];
  organizationList: any[] = [];
  programStages: any[] = [];
  dataElementsList: any[] = [];
  dataElementsIds: any[] = [];
  dataElementsDetails: any[] = [];
  odkDataIndexes: any[] = [];
  initialOdkDataIndexes: any[] = [];
  orgUnitLevels: any[] = [];
  getOdkDataArray;
  getInitialOdkDataArray;
  onaFieldsToBeRemoved: any[] = [];
  metadataFieldsArray: any[] = ['deviceid', 'formhub/uuid', 'meta/deprecatedID', 'meta/instanceID', 'end',
                          'meta/instanceName', 'start', 'today', '_attachments', '_bamboo_dataset_id',
                          '_duration', '_edited', '_geolocation', '_last_edited', '_media_all_received',
                          '_media_count', '_notes', '_status', '_submission_time', '_submitted_by', '_tags',
                          '_total_media', '_uuid', '_version', '_xform_id', '_xform_id_string'];

  deleteMetadataFields = true;
  // Promises
  deInfoPromise: Promise<any>;

  // Excel export arrays
  elementNotEnrolled: any;
  elementWithNoEventId: any;
  elementDoesNotExistOnDHIS: any;
  unableToAddIntoTheStageArray: any;
  successFullyAddedData: any[];

  trackedEntityDetails: any[] = [];
  typeArr: any[] = [];
  odkLength = 0;

  constructor(private injector: Injector, private datePipe: DatePipe, private connectionService: ConnectionService) {
    super(injector);
    this.checkConnection();
  }

  checkConnection() {
    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (this.isConnected && this.odkList.length === 0 && this.countOdkListCall === 0) {
        this.getOdkLists();
      }
      if (this.isConnected && this.organizationList.length === 0 && this.countOrganizationListCall === 0) {
        // this.getAllOrganizations();
        this.getOrganizationUnitLevels();
      }
    });
  }

  ngOnInit() {

    this.createMainGroup();
    this.createUploadDataForm();
    this.getOdkLists();
    // this.getAllOrganizations();
    this.getOrganizationUnitLevels();
    this.mainGroup.controls.odkListsSearch.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterOdks();
      });
    this.mainGroup.controls.dhisProgramsSearch.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterProgram();
      });
    this.mainGroup.controls.organizationSearch.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterOrganization();
      });
  }
  // tslint:disable-next-line: use-lifecycle-interface
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  createMainGroup() {
    this.mainGroup = this.fb.group({
      odkLists: new FormControl(''),
      odkListsSearch: new FormControl(''),
      dhisLevels: new FormControl(''),
      dhisPrograms: new FormControl(''),
      dhisProgramsSearch: new FormControl(''),
      dhisStage: new FormControl(''),
      organization: new FormControl(''),
      organizationSearch: new FormControl('')
    });
  }

  createUploadDataForm() {
    this.uploadDataForm = this.fb.group({
      keyField: new FormControl('', [Validators.required]),
      keyFieldAttribute: new FormControl('', [Validators.required])
    });
  }

  createOnaDataFields() {
    this.onaDataFieldsGroup = this.fb.group({
      fields: new FormControl(''),
      fieldsSearch: new FormControl('')
    });
    this.onaDataFieldsGroup.controls.fieldsSearch.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterFields();
      });
  }


  // To search in the odk list drop down list
  filterOdks() {
    if (!this.odkList) {
      return;
    }
    // get the search keyword
    let search = this.mainGroup.controls.odkListsSearch.value;
    if (!search) {
      this.filteredOdks.next(this.odkList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    if (search.length >= 2) {
      // filter the banks
      this.filteredOdks.next(
        this.odkList.filter(item => item.formName.toString().toLowerCase().indexOf(search) > -1)
      );
    }
  }

  // To serach in dhis programs list
  filterProgram() {
    if (!this.programList) {
      return;
    }
    // get the search keyword
    let search = this.mainGroup.controls.dhisProgramsSearch.value;
    if (!search) {
      this.filteredPrograms.next(this.programList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    if (search.length >= 2) {
      // filter the banks
      this.filteredPrograms.next(
        this.programList.filter(item => item.displayName.toString().toLowerCase().indexOf(search) > -1)
      );
    }
  }

  filterDataElements() {
    if (!this.dataElementsDetails) {
      return;
    }
    // get the search keyword
    let search = this.indexesForm.controls.dataElementSearch.value;
    if (!search) {
      this.filteredDataElements.next(this.dataElementsDetails.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    if (search.length >= 2) {
      // filter the banks
      this.filteredDataElements.next(
        this.dataElementsDetails.filter(item => item.displayName.toString().toLowerCase().indexOf(search) > -1)
      );
    }
  }

  // To serach in dhis programs list
  filterOrganization() {
    if (!this.organizationList) {
      return;
    }
    // get the search keyword
    let search = this.mainGroup.controls.organizationSearch.value;
    if (!search) {
      this.filteredOrganization.next(this.organizationList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    if (search.length >= 2) {
      // filter the banks
      this.filteredOrganization.next(
        this.organizationList.filter(item => item.displayName.toString().toLowerCase().indexOf(search) > -1)
      );
    }
  }

  // To search extracted fields
  filterFields() {
    if (!this.odkDataIndexes) {
      return;
    }
    // get the search keyword
    let search = this.onaDataFieldsGroup.controls.fieldsSearch.value;
    if (!search) {
      this.filteredFields.next(this.odkDataIndexes.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    if (search.length >= 2) {
      this.filteredFields.next(
        this.odkDataIndexes.filter(item => item.toString().toLowerCase().indexOf(search) > -1)
      );
    }
  }

  // Go to specific tab
  goToTab(tabIndex) {
    this.tabIndex = tabIndex;
  }

  // Get odk lists that the user has access too
  getOdkLists() {
    this.selectedOdkFormName = '';
    this.countOdkListCall = 0;
    this.isLoading = true;
    this.odkList = [];
    this.loader.showLoader();
    this.api.getDataWithUsername(this.globalVar.odkListsUrl, 'ona').subscribe(
      (resp) => {
        this.isLoading = false;
        this.loader.hideLoader();
        Object.keys(resp).forEach((key) => {
          Object.keys(resp[key].forms).forEach(async (idx) => {
            await this.odkList.push({
              formId: resp[key].forms[idx].formid,
              formName: resp[key].forms[idx].name,
              dataUrl: this.globalVar.odkDataBasicUrl + resp[key].forms[idx].formid,
              folderUrl: resp[key].url
            });
          });
        });
        this.filteredOdks.next(this.odkList.slice());
        this.Select.open();
        this.countOdkListCall++;
      },
      (error) => {
        this.isLoading = false;
        this.loader.hideLoader();
        console.log(error);
      }
    );
  }

  async getOrganizationUnitLevels() {
    this.loader.showLoader();
    this.isLoading = true;
    this.api.getData(this.globalVar.dhisOrganizationUnitLevels, 'dhis2').subscribe(
      (resp) => {
        this.isLoading = false;
        this.loader.hideLoader();
        this.orgUnitLevels = Object.values(resp);
        this.orgUnitLevels.sort((a, b) => {
          return parseInt(a.level, 0) - parseInt(b.level, 0);
        });
      },
      (error) => {
        this.isLoading = false;
        this.loader.hideLoader();
        console.log(error);
      }
    );
  }

  getAllOrganizations(level) {
    this.selectedProgramName = '';
    this.isLoading = true;
    this.trackedEntityDetails = [];
    this.countOrganizationListCall = 0;
    this.uploadDataForm.controls.keyField.reset();
    this.uploadDataForm.controls.keyFieldAttribute.reset();
    this.organizationList = [];
    this.loader.showLoader();
    this.api.getData(this.globalVar.organizationUnitsByLevelUrl + level, 'dhis2').subscribe((resp) => {
      this.isLoading = false;
      this.loader.hideLoader();
      // tslint:disable-next-line: no-string-literal
      this.organizationList = resp['organisationUnits'];
      this.filteredOrganization.next(this.organizationList.slice());
      this.countOrganizationListCall++;
    }, (error) => {
      this.isLoading = false;
      this.loader.hideLoader();
      console.log(error);
    });
  }

  clearSelection(type) {
    if (type === 'odk') {
      this.mainGroup.controls.odkListsSearch.reset();
    } else if (type === 'organizations') {
      this.mainGroup.controls.organizationSearch.reset();
    } else if (type === 'programs') {
      this.mainGroup.controls.dhisProgramsSearch.reset();
    }
  }

  getProgramsByOrgUnitId(ouid) {
    this.selectedProgramName = '';
    this.trackedEntityDetails = [];
    this.isLoading = true;
    this.uploadDataForm.controls.keyField.reset();
    this.uploadDataForm.controls.keyFieldAttribute.reset();
    this.showEmptyDEMsg = false;
    this.programList = [];
    this.loader.showLoader();
    this.api.getData(this.globalVar.programByOrgUrl + ouid, 'dhis2').subscribe(
      (resp) => {
        this.isLoading = false;
        this.loader.hideLoader();
        // tslint:disable-next-line: no-string-literal
        this.programList = resp['programs'];
        this.filteredPrograms.next(this.programList.slice());
      },
      (error) => {
        this.isLoading = false;
        this.loader.hideLoader();
        console.log(error);
      }
    );
  }

  async getOdkData(formId, dataUrl) {
    this.isLoading = true;
    this.initialOdkDataIndexes = [];
    this.onaFieldsToBeRemoved = [];
    this.getOdkDataArray = [];
    this.getInitialOdkDataArray = [];
    this.odkDataIndexes = [];
    this.odkDataMsg = 'Getting the array of data and cleanning it from null values and checking sub-groups';
    this.showEmptyOdkMsg = false;
    this.showFields = false;
    this.loader.showLoader();
    const odkDataPromise = new Promise((resolve, reject) => {
      this.api.getData(dataUrl, 'ona').subscribe(
        async (resp) => {
          this.loader.hideLoader();
          this.isLoading = false;
          this.odkDataMsg = '';
          Object.keys(resp).forEach((key) => {
            this.getOdkDataArray.push(resp[key]);
          });
          this.getInitialOdkDataArray = this.getOdkDataArray;
          // Get the properties of the data array
          let props = [];
          props = Array.from(new Set(this.getOdkDataArray.flatMap(e => Object.keys(e), [])));
          // Clean null values
          for (const elem of this.getOdkDataArray) {
            for (const prop of props) {

              // We can use the same if condition for both comaprisons but it will stay like this for now
              if (elem[prop] === null || elem[prop] === undefined) {
                elem[prop] = '';
              }

              // Check if there empty arrays or arrays having null values like [null, null]
              if (Array.isArray(elem[prop]) || typeof (elem[prop]) === 'object') {
                if (elem[prop].indexOf(null) !== -1 || elem[prop].length === 0) {
                  elem[prop] = '';
                }
              }

              // // Check if there is undefined/null values and replace it by empty values
              // if (elem[prop] === undefined || elem[prop] === null) {
              //   elem[prop] = '';
              // }
            }
          }

          // Getting the first array of begin-repeat nested array within the main data we've got from ONA
          this.typeArr = [];
          const newArr = this.getOdkDataArray.map((obj, idx) => {
            const newObj = {};
            // tslint:disable-next-line: forin
            // for (const key in obj[0]) {
            //   this.typeArr.push({type: typeof obj[key], field: key});
            // }
            for (const key in obj) {
              const type = typeof obj[key];

              if (type === 'object') {
                // tslint:disable-next-line: forin
                for (const subkey in obj[key][0]) {
                  newObj[key + '_' + subkey] = obj[key][0][subkey];
                }
              } else {
                newObj[key] = obj[key];
              }
            }
            // console.log(this.typeArr);
            return newObj;
          });

          this.getOdkDataArray = newArr;
          console.log(this.getOdkDataArray, this.getOdkDataArray.length, this.odkDataIndexes.length);
          this.getOdkDataArray.length === 0 ? this.showEmptyOdkMsg = true : this.showEmptyOdkMsg = false;
          // Delete metadata fields
          if (this.deleteMetadataFields) {
            await this.removeMetadataFields(this.getOdkDataArray);
          }
          // Extract arrays indexes/properties
          this.odkDataIndexes = Object.values(this.extractArrayIndexes(this.getOdkDataArray));
          this.initialOdkDataIndexes = this.odkDataIndexes;
          console.log(this.getOdkDataArray, this.getOdkDataArray.length, this.odkDataIndexes.length);
          this.filteredFields.next(this.odkDataIndexes.slice());
          // this.OdkNestedArrayToString(this.odkDataIndexes, this.getOdkDataArray).then((res) => {
          // });
          this.createOnaDataFields();
          resolve();
        },
        (error) => {
          this.isLoading = false;
          this.loader.hideLoader();
          this.odkDataMsg = '';
          reject();
          console.log(error);
        }
      );
    });
    // odkDataPromise.then(() => {
    //   this.OdkNestedArrayToString(this.odkDataIndexes, this.getOdkDataArray);
    // });
  }
  async removeMetadataFields(getOdkDataArray: any) {
    await getOdkDataArray.forEach((row) => {
      this.metadataFieldsArray.forEach(key => {
        // console.log(key);
        if (row.hasOwnProperty(key)) {
          delete row[key];
        }
      });
    });
  }

  getOnaFieldsToBeRemoved(field) {
    this.removeUnnecessaryFieldsMsg = '';
    this.onaFieldsToBeRemoved = [];
    this.onaFieldsToBeRemoved.push(this.onaDataFieldsGroup.controls.fields.value);
  }
  removeUnnecessaryFields() {
    this.removeUnnecessaryFieldsMsg = '';
    this.showFields = false;
    if (this.onaFieldsToBeRemoved === undefined || this.onaFieldsToBeRemoved.length === 0) {
      this.removeUnnecessaryFieldsMsg = 'No fields selected to be removed';
    // } else if ((this.odkDataIndexes.length - parseInt((this.onaFieldsToBeRemoved[0].length), 10)) < this.dataElementsDetails.length) {
    //   this.removeUnnecessaryFieldsMsg = 'Number of fields selected will drop the remaining into less than the data elements field number';
    } else if (this.onaFieldsToBeRemoved[0].length > 0
      // && this.odkDataIndexes.length !== this.dataElementsDetails.length
      ) {
      this.getOdkDataArray.forEach((row) => {
        this.onaFieldsToBeRemoved[0].forEach(key => { delete row[key]; });
      });
      // Resetting the odk drop down list
      this.odkDataIndexes = [];
      this.odkDataIndexes = this.extractArrayIndexes(this.getOdkDataArray);
      this.filteredFields.next(this.odkDataIndexes.slice());
    }
    // else if (this.odkDataIndexes.length === this.dataElementsDetails.length) {
    //   this.removeUnnecessaryFieldsMsg = 'You cannot remove a field anymore as they both have now the same size';
    // }
  }

  // getName(fcvalue, deid, fgcontrols) {
  //   console.log(fcvalue);
  //   console.log(deid);
  //   console.log(fgcontrols);
  // }

  getProgramStage(programId) {
    this.programStages = [];
    this.deDivShow = false;
    this.dataElementsDetails = [];
    this.uploadDataForm.controls.keyField.reset();
    this.uploadDataForm.controls.keyFieldAttribute.reset();
    this.showEmptyDEMsg = false;
    this.isLoading = true;
    this.loader.showLoader();
    this.api.getData(this.globalVar.stageByProgramUrl + programId, 'dhis2').subscribe(
      (resp) => {
        this.loader.hideLoader();
        this.isLoading = false;
        // tslint:disable-next-line: no-string-literal
        this.programStages = resp['programStages'];
      },
      (error) => {
        this.isLoading = false;
        this.loader.hideLoader();
        console.log(error);
      }
    );

  }

  getTrackedEntityAttributes(programId) {
    // w8K4RIh1TRU.json?fields=trackedEntityTypeAttributes
    // const ou = this.mainGroup.controls.organization.value;
    // const programId = this.mainGroup.controls.dhisPrograms.value;
    this.isLoading = true;
    this.loader.showLoader();
    this.trackedEntityDetails = [];
    this.api.getData(this.globalVar.getProgramTrackedEntityAttributes + '&filter=id:eq:' + programId, 'dhis2').subscribe(
      (resp) => {
        this.isLoading = false;
        this.loader.hideLoader();
        const trackedEntityDetails = resp['programs'][0]['programTrackedEntityAttributes'];
        for (const elem of trackedEntityDetails) {
          const displayNameField = elem.displayName.replace(this.selectedProgramName, '');
          const displayShortNameField = elem.displayShortName.replace(this.selectedProgramName, '');
          this.trackedEntityDetails.push({ id: elem.trackedEntityAttribute.id, displayName: displayNameField, displayShortName: displayShortNameField });
        }
      },
      (error) => {
        this.isLoading = false;
        this.loader.hideLoader();
        console.log(error);
      }
    );
  }

  getProgramName(programName) {
    this.selectedProgramName = programName;
  }

  getStageDataElements(stageId) {
    this.isLoading = true;
    this.dataElementsList = [];
    this.dataElementsIds = [];
    this.dataElementsDetails = [];
    this.uploadDataForm.controls.keyField.reset();
    this.uploadDataForm.controls.keyFieldAttribute.reset();
    this.showEmptyDEMsg = false;
    this.deDivShow = false;
    this.loader.showLoader();
    this.api.getData(this.globalVar.dataElementsOfStageUrl + stageId, 'dhis2').subscribe(
      (resp) => {
        // tslint:disable-next-line: no-string-literal
        this.dataElementsList = resp['programStages'][0]['programStageDataElements'];
        for (const de of this.dataElementsList) {
          this.dataElementsIds.push({ dataElementId: de.dataElement.id });
        }
        // this.dataElementsIds = this.dataElementsList['dataElement'];
        this.getDataElementDetails(this.dataElementsIds);
        this.dataElementsIds.length === 0 ? this.showEmptyDEMsg = true : this.showEmptyDEMsg = false;
        this.deInfoPromise.then(() => {
          this.deDivShow = true;
          this.dataElementsDetails.push({
            // tslint:disable-next-line: no-string-literal
            id: 'eventDate', code: 'eventDate', displayName: 'Event/Registration Date',
            // tslint:disable-next-line: no-string-literal
            deUrl: '', optionSet: '', valueType: 'date'
          });
          // this.createDeMappingForm();
          this.isLoading = false;
          this.loader.hideLoader();
        });
      },
      (error) => {
        this.isLoading = false;
        this.deDivShow = false;
        this.loader.hideLoader();
        console.log(error);
      }
    );
  }

  extractArrayIndexes(array) {
    // We can use Object.keys(array[0]) and it will return all keys
    // But with flatMap will return indexes that might not be available in all arrays
    let indexesResult;
    return indexesResult = Array.from(new Set(array.flatMap(e => Object.keys(e), [])));
  }

  // This function will check if each row coming from ONA contain a nested array inside of it
  // We will split it up into a comma separated string
  async OdkNestedArrayToString(extractedIndexes, dataArray) {
    // for (const idx of extractedIndexes) {
    const result = dataArray.reduce((a, c) => {
      for (const key of extractedIndexes) {
        if (Array.isArray(c[key]) || typeof (c[key]) === 'object') {
          c[key] = c[key].map(s =>
            Object.values(s)
          ).join(', ');
        }
      }
      a.push(c);
      return a;
    }, []);
    // console.log(result);
    // }
  }

  getDataElementDetails(arrayOfDE) {
    let arrayOfDELength = arrayOfDE.length;
    this.deInfoPromise = new Promise((resolve, reject) => {
      for (const deId of arrayOfDE) {
        this.api.getData(this.globalVar.dataElementDetailsUrl + deId.dataElementId, 'dhis2').subscribe(
          (resp) => {
            // tslint:disable-next-line: no-string-literal
            this.dataElementsDetails.push({
              // tslint:disable-next-line: no-string-literal
              id: resp['id'], code: resp['code'], displayName: resp['displayFormName'],
              // tslint:disable-next-line: no-string-literal
              deUrl: resp['href'], valueType: resp['valueType']
            });

            if (arrayOfDELength === 0) {
              resolve();
            }
          },
          (error) => {
            reject();
            console.log(error);
          }
        );
        arrayOfDELength--;
      }

    });
  }

  // createDeMappingForm() {
  //   this.deMappingForm = this.fb.group({
  //     dataElementSearch: new FormControl()
  //   });
  //   this.deMappingForm.controls.dataElementSearch.valueChanges
  //     .pipe(takeUntil(this._onDestroy))
  //     .subscribe(() => {
  //       this.filterDataElements();
  //   });
  // }

  async generateMappingFields() {
    this.showFields = false;
    this.loader.showLoader();
    this.isLoading = true;
    this.removeUnnecessaryFieldsMsg = '';
    if (this.odkDataIndexes.length > 0) {
      await this.createIndexesForm(this.odkDataIndexes).then(() => {
        this.showFields = true;
        this.tabIndex = 1;
      });
    }
    this.loader.hideLoader();
    this.isLoading = false;
    // console.log(this.dataElementsDetails);
    this.dataElementsDetails.sort((a, b) => {
      if (a.displayName < b.displayName) {
        return -1;
      }
      if (a.displayName > b.displayName) {
        return 1;
      }
    });
    this.filteredDataElements.next(this.dataElementsDetails.slice());
    // console.log(this.filteredDataElements);
  }

  async createIndexesForm(extractedIndexesArray) {
    const controls = extractedIndexesArray.reduce((g, k) => {
      g[k] = '';
      return g;
    }, {});
    this.indexesForm = this.fb.group(controls, [Validators.required]);
    this.indexesForm.addControl('dataElementSearch', new FormControl(''));
    this.indexesForm.controls.dataElementSearch.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterDataElements();
    });
  }

  mapData() {
    this.isLoading = true;
    this.loader.showLoader();
    this.mapDataError = '';
    // This function will check if a user specified an ODK field more than once
    // To a data element field
    // let countRepetition = 0;
    const repeatedValues = [];
    let mainCounter = 0;
    this.odkDataIndexes.forEach((idx) => {
      repeatedValues.push({ id: this.indexesForm.get(idx).value, name: idx, counter: 1 });
    });
    const repeatedSelection = repeatedValues.reduce((m, o) => {
      const found = m.find(e => e.id === o.id);
      found ? found.counter += 1 : m.push(o);
      return m;
    }, []);

    for (const repeated of repeatedSelection) {
      // Check if counter of any array is more than 1
      if (repeated.counter > 1) {
        mainCounter += 1;
      }
    }
    // If there is no duplication in mapped field between ONA and DHIS2 data elements
    // if (mainCounter === 0) {
    const newDataArray = [];
    this.getOdkDataArray.forEach(e => {
        const newItem = {};
        this.odkDataIndexes.forEach((arrayIndexControl) => {
          newItem[this.indexesForm.get(arrayIndexControl).value] = e[arrayIndexControl];
        });
        newDataArray.push(newItem);
      });
    this.getOdkDataArray = newDataArray;
    this.isLoading = false;
    this.loader.hideLoader();
    this.tabIndex = 2;
    // }
    // else {
    //   const repeatedDropDownList = repeatedSelection.filter(e => e.counter > 1);
    //   for (const row of repeatedDropDownList) {
    //     this.indexesForm.get(row.name).setErrors({ 'duplicated selection': true });
    //   }
    //   this.isLoading = false;
    //   this.loader.hideLoader();
    //   this.mapDataError = 'Fields underlined with red, have commun selected fields with other ONA fields.';
    // }
  }

  // Search the selected value if exists in DHIS2
  async checkValueInDhis2(dataArray, searchKey, appendedUrl, keyValue, ou, program) {
    return new Promise((resolve, reject) => {
      this.api.getData(this.globalVar.basicSearchFieldUrl + appendedUrl, 'dhis').subscribe(
        (resp) => {
          resolve(resp);
          // return resp;
        },
        (error) => {
          this.elementDoesNotExistOnDHIS['Reason'] = error;
          this.elementDoesNotExistOnDHIS.push(dataArray);
          reject();
          console.log(error);
        }
      );
    });
  }

  async checkInstanceEnrollment(dataArray, returnedInstanceID, programId, fields) {
    return new Promise((resolve, reject) => {
      // tslint:disable-next-line: max-line-length
      this.api.getData(this.globalVar.checkEnrollementUrl + returnedInstanceID +
        '.json?program=' + programId + '&fields=' + fields, 'dhis').subscribe(
          (resp) => {
            // if (resp['httpStatusCode'] === 200) {
              resolve(resp);
            // } else if (resp['httpStatusCode'] !== 500) {
            //   this.elementNotEnrolled['Reason'] = 'Could not check if this instance ID is enrolled';
            //   this.elementNotEnrolled.push(dataArray);
            //   reject('Error in sent Data');
            // }
          },
          (error) => {
            this.elementNotEnrolled['Reason'] = error;
            this.elementNotEnrolled.push(dataArray);
            reject(error);
            console.log(error);
          }
        );
    });
  }

  async enroll(data) {
    return new Promise((resolve, reject) => {
      this.api.postEnrollment(this.globalVar.makeEnrollment, 'dhis2', data).subscribe(
        (resp) => {
          if (resp['httpStatus'] === 'OK' && resp['httpStatusCode'] === 200
            && resp['message'] === 'Import was successful.') {
            resolve();
          } else {
            reject();
            console.log(resp);
          }
        },
        (error) => {
          reject();
          console.log(error);
        }
      );
    });
  }

  getOdkFileName(formName) {
    this.selectedOdkFormName = formName;
  }

  exportRelationShips(successFullyAddedData, elementNotEnrolled, elementWithNoEventId,
                      elementDoesNotExistOnDHIS, unableToAddIntoTheStageArray, excelTitle = '') {
    excelTitle = excelTitle === '' ? 'odk_log_file' : excelTitle;
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // const wsDataAddedToStage: XLSX.WorkSheet = XLSX.utils.json_to_sheet(successFullyAddedData);
    // XLSX.utils.book_append_sheet(wb, wsDataAddedToStage, 'Data successfully added');

    const wsNotEnrolled: XLSX.WorkSheet = XLSX.utils.json_to_sheet(elementNotEnrolled);
    XLSX.utils.book_append_sheet(wb, wsNotEnrolled, 'Data that could not be enrolled');

    const wsNoEvent: XLSX.WorkSheet = XLSX.utils.json_to_sheet(elementWithNoEventId);
    XLSX.utils.book_append_sheet(wb, wsNoEvent, 'Data with no available event');

    const wsDoesNotExist: XLSX.WorkSheet = XLSX.utils.json_to_sheet(elementDoesNotExistOnDHIS);
    XLSX.utils.book_append_sheet(wb, wsDoesNotExist, 'Data does not exist at all');

    const wsNoDataInStage: XLSX.WorkSheet = XLSX.utils.json_to_sheet(unableToAddIntoTheStageArray);
    XLSX.utils.book_append_sheet(wb, wsNoDataInStage, 'Data was not added');

    XLSX.writeFile(wb, excelTitle + '.xlsx');
  }

  async uploadRow(dataArray, eventId, programId, prgStage, ou,
                  returnedInstanceID, stageStatus, due, evDate, compDate) {
    // this.loader.showLoader();
    // this.isLoading = true;
    const completedDate = compDate;
    const dueDate = due;
    const event = eventId;
    const eventDate = evDate;
    const orgUnit = ou;
    const program = programId;
    const programStage = prgStage;
    const status = 'COMPLETED';
    const trackedEntityInstance = returnedInstanceID;
    const dataValues: any[] = [];
    // Object.keys(dataArray).forEach((key) => {
    //   dataValues.push({ dataElemet: key, value: dataArray[key] });
    // });
    for (const key in dataArray) {
      if (dataArray.hasOwnProperty(key)) {
        dataValues.push({ value: dataArray[key], dataElement: key });
      }
    }
    const finalDataArray = [
      {
        completedDate: completedDate,
        dueDate: dueDate,
        event: event,
        eventDate: eventDate,
        orgUnit: orgUnit,
        program: program,
        programStage: programStage,
        status: status,
        trackedEntityInstance: trackedEntityInstance,
        dataValues: dataValues
      }
    ];
    console.log('final data array: ', finalDataArray);
    return new Promise((resolve, reject) => {
      this.api.putData(this.globalVar.addEventDataUrl + event, 'dhis2', finalDataArray[0], 30000).subscribe(
        (resp) => {
          // this.isLoading = false;
          // this.loader.hideLoader();
          if (resp['httpStatusCode'] !== 200 && resp['status'] === 'ERROR') {
            console.log(resp['response']['conflicts'][0].object, resp['response']['conflicts'][0].value);
            dataArray['Reason'] = resp['response']['conflicts'][0].object + ' - ' + resp['response']['conflicts'][0].value;
            this.unableToAddIntoTheStageArray.push(dataArray);
            reject(resp);
          } else {
            if (resp['httpStatusCode'] === 200 && resp['status'] === 'OK' && resp['message'] === 'Import was successful.') {
              this.successFullyAddedData['Reason'] = resp['message'];
              this.successFullyAddedData.push(dataArray);
              resolve(dataArray);
            }
          }
          // console.log(this.successFullyAddedData, this.unableToAddIntoTheStageArray);
        },
        (error) => {
          dataArray['Reason'] = error;
          this.unableToAddIntoTheStageArray.push(dataArray);
          reject();
          // this.isLoading = false;
          // this.loader.hideLoader();
          console.log(error);
        }
      );
    });
  }
  getEventId(instanceId, programId) {
    return new Promise((resolve, reject) => {
      this.api.getData(this.globalVar.checkEnrollementUrl + instanceId + '.json?program=' + programId + '&fields=*', 'dhis2').subscribe(
        (resp) => {
          resolve(resp);
          // console.log('event: ', resp);
        },
        (error) => {
          reject();
          console.log('event error: ', error);
        }
      );
    });
  }

  async uploadData() {
    this.odkLength = 0;
    this.isLoading = true;
    this.loader.showLoader();
    this.elementNotEnrolled = [];
    this.elementWithNoEventId = [];
    this.elementDoesNotExistOnDHIS = [];
    this.unableToAddIntoTheStageArray = [];
    this.successFullyAddedData = [];
    const myDate = new Date();
    const enrollDate = this.datePipe.transform(myDate, 'yyyy-MM-dd');
    const keyField = this.uploadDataForm.controls.keyField.value;
    const keyFieldAttribute = this.uploadDataForm.controls.keyFieldAttribute.value;
    // const keyField = 'OcuwLhE6Gu0';
    const data = this.getOdkDataArray;
    const ou = this.mainGroup.controls.organization.value;
    const programId = this.mainGroup.controls.dhisPrograms.value;
    // Adding key field to the data that will be uploaded
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < data.length; i++) {
      data[i][keyFieldAttribute] = this.getInitialOdkDataArray[i][keyField];
    }
    // From the array
    // const searchValue = 'H0000012223';
    // 1. Search value API call
    this.odkLength = this.dataElementsDetails.length;
    for (const elem of data) {
      const searchValue = elem[keyFieldAttribute];
      // Drop the field from the array to avoid an error of data element does not exists on DHIS2
      delete elem[keyFieldAttribute];
      const eventDate = elem['eventDate'];
      delete elem['eventDate'];

      let eventsArray = [];
      let eventId = '';
      // tslint:disable-next-line: max-line-length
      const appendToUrlEqual = '&ou=' + ou + '&ouMode=ACCESSIBLE&program=' + programId + '&filter=' + keyFieldAttribute + ':EQ:' + searchValue;
      const awaitCheckValue = await this.checkValueInDhis2(elem, searchValue, appendToUrlEqual, keyField, ou, programId).then(async (res) => {
        if (res['rows'].length > 0) {
          const returnedInstanceID = res['rows'][0][0];
          // Check if enrolled
          const awaitEnrolled = await this.checkInstanceEnrollment(elem, returnedInstanceID, programId, '[enrollments]').then(async (enroll) => {
            const awaitEventId = await this.getEventId(returnedInstanceID, programId).then(async (event) => {
              eventsArray = event['enrollments'][0]['events'];
              // Save the event instance id into dhis2
              const eventElem = eventsArray.find(e => e.programStage === this.mainGroup.controls.dhisStage.value);
              eventId = eventElem.event;
              // console.log('enroll ids: ', enroll['enrollments'], enroll['enrollments'][0].program, programId);
              if (enroll['enrollments'][0].program === programId && enroll['enrollments'][0].orgUnit === ou) {
                // console.log(enroll['enrollments'][0].program, programId, enroll['enrollments'][0].orgUnit, ou);
                // Upload data
                // const data = {
                //   trackedEntityInstance: returnedInstanceID, program: programId,
                //   status: 'COMPLETED', orgUnit: ou, enrollmentDate: enrollDate, incidentDate: enrollDate
                // };
                this.uploadRow(elem, eventId, programId, this.mainGroup.controls.dhisStage.value,
                  ou, returnedInstanceID, 'COMPLETED', eventDate, eventDate, enrollDate).then((uploadArray) => {
                    // Add to successFullyAddedData
                    // console.log(elem);
                    // this.successFullyAddedData.push(elem);
                    console.log('Stage Data Added');
                  }).catch((error) => {
                    // this.unableToAddIntoTheStageArray.push(elem);
                  });
              } else {
                // Enroll it into program
                const data = {
                  trackedEntityInstance: returnedInstanceID, program: programId,
                  status: 'COMPLETED', orgUnit: ou, enrollmentDate: enrollDate, incidentDate: enrollDate
                };
                await this.enroll(data).then((res) => {
                  this.uploadRow(elem, eventId, programId, this.mainGroup.controls.dhisStage.value,
                    ou, returnedInstanceID, 'COMPLETED', eventDate, eventDate, enrollDate).then((uploadArray) => {
                      // Add to successFullyAddedData
                      // console.log(elem);
                      // this.successFullyAddedData.push(elem);
                      console.log('Stage Data Added');
                    }).catch((error) => {
                      // elem['Reason'] = error.response.conflicts[0].object + ' - ' + error.response.conflicts[0].value;
                      // this.unableToAddIntoTheStageArray.push(elem);
                      console.log(error);
                    });
                }).catch((rej) => {
                  // Add to log array as not able to be enrolled
                  this.elementNotEnrolled['Reason'] = 'Instance ID could not be enrolled';
                  this.elementNotEnrolled.push(elem);
                });
              }
            }).catch((rejectEvent) => {
              // Add to events id log
              this.elementWithNoEventId['Reason'] = 'No event ID available';
              this.elementWithNoEventId.push(elem);
            });
          }).catch((error) => {
            // Add to array to be downloaded later into an excel file
            console.log('Enrollment error: ', error);

          });
        } else {
          // Add to array and to be downloaded into excel file later
          this.elementDoesNotExistOnDHIS['Reason'] = 'Could not find the key value on DHIS2';
          this.elementDoesNotExistOnDHIS.push(elem);
          console.log('No data available for this ID');

        }

        this.odkLength--;

      }).catch((error) => {
        // Add to the log array to be downloaded into excel file later
        console.log(this.elementDoesNotExistOnDHIS);
        // this.elementDoesNotExistOnDHIS.push(elem);
      }
      );
    }
    this.isLoading = false;
    this.loader.hideLoader();
    this.exportRelationShips(this.successFullyAddedData, this.elementNotEnrolled, this.elementWithNoEventId,
      this.elementDoesNotExistOnDHIS, this.unableToAddIntoTheStageArray, 'odk_import_log_file_ ' + this.selectedOdkFormName);
  }
}
