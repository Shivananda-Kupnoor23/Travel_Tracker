namespace travel.tracker;

using { managed } from '@sap/cds/common';

entity Employees : managed {
  key ID       : String(10);
  name         : String(100) @mandatory;
  email        : String(100) @mandatory;
  password     : String(100) default 'password123';
  department   : String(50);
  manager      : String(100);
  role         : String(20) default 'employee';  // employee | admin
  travels      : Composition of many Travels on travels.employee = $self;
}

entity Travels : managed {
  key ID         : String(10);
  employee       : Association to Employees;
  travelType     : String(20) @mandatory;       // Domestic | International
  fromCountry    : String(100);
  toCountry      : String(100);
  fromCity       : String(100);
  toCity         : String(100);
  startDate      : Date @mandatory;
  endDate        : Date @mandatory;
  purpose        : String(500);
  status         : String(20) default 'Planned'; // Planned | Approved | Travelling | Completed | Cancelled
  passportNumber : String(50);
  visaStatus     : String(20);                   // Have Visa | Need Visa | Applied
}
