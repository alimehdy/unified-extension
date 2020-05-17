import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalVarService {
  // Odk Lists
  odkListsUrl = 'https://api.ona.io/api/v1/projects.json?';
  odkDataBasicUrl = 'https://api.ona.io/api/v1/data/';
  odkStartsWith = 'Unified_';
  // DHIS2
  dhisOrganizationUnitLevels = 'https://medair.dhis2.bluesquare.org/api/29/filledOrganisationUnitLevels';
  // allOrganizationUrl = 'https://medair.dhis2.bluesquare.org/api/30/organisationUnits.json?fields=[id,displayName,children]&paging=false';
  allOrganizationUrl = 'https://medair.dhis2.bluesquare.org/api/30/organisationUnits.json?fields=[id,displayName]&paging=false';
  organizationUnitsByLevelUrl = 'https://medair.dhis2.bluesquare.org/api/30/organisationUnits.json?fields=[id,displayName,children,level]&paging=false&filter=level:eq:';
  programByOrgUrl = 'https://medair.dhis2.bluesquare.org/api/programs.json?ouMode=SELECTED&paging=false&fields=id,displayName&ou=';
  stageByProgramUrl = 'https://medair.dhis2.bluesquare.org/api/programStages.json?paging=false&fields=*&filter=program.id:eq:';
  dataElementDetailsUrl = 'https://medair.dhis2.bluesquare.org/api/dataElements/';
  // tslint:disable-next-line: max-line-length
  dataElementsOfStageUrl = 'https://medair.dhis2.bluesquare.org/api/programStages.json?paging=false&fields=[programStageDataElements]&filter=programStageDataElements.programStage.id:eq:';
  // tslint:disable-next-line: max-line-length
  basicSearchFieldUrl = 'https://medair.dhis2.bluesquare.org/api/30/trackedEntityInstances/query.json?fields=*';
  // tslint:disable-next-line: max-line-length
  checkEnrollementUrl = 'https://medair.dhis2.bluesquare.org/api/30/trackedEntityInstances/';
  makeEnrollment = 'https://medair.dhis2.bluesquare.org/api/30/enrollments/';
  addEventDataUrl = 'https://medair.dhis2.bluesquare.org/api/30/events/';
  getProgramTrackedEntityAttributes = 'https://medair.dhis2.bluesquare.org/api/programs.json?paging=false&fields=*';
  constructor() { }
}
