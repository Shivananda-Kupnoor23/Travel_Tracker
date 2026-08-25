using travel.tracker from '../db/schema';

service TravelService @(path: '/travel') {

  entity Employees as projection on tracker.Employees;
  entity Travels   as projection on tracker.Travels;

  // Dashboard aggregation functions
  function getDashboardStats()       returns {
    travellingToday    : Integer;
    upcoming7Days      : Integer;
    returningToday     : Integer;
    abroadNow          : Integer;
    countriesCount     : Integer;
    domesticToday      : Integer;
    internationalToday : Integer;
  };

  function getTravellingToday()      returns array of Travels;
  function getUpcomingTravel()       returns array of Travels;
  function getReturningToday()       returns array of Travels;
  function getCurrentlyAbroad()      returns array of Travels;
  function getCountryDistribution()  returns array of {
    country : String;
    count   : Integer;
  };
  function getDomesticDistribution() returns array of {
    city  : String;
    count : Integer;
  };
  function getCalendarData(year : Integer, month : Integer) returns array of {
    date       : String;
    travelling : Integer;
    returning  : Integer;
    departing  : Integer;
  };

  // Login
  action login(email : String, password : String) returns {
    success    : Boolean;
    employeeId : String;
    name       : String;
    role       : String;
    department : String;
    message    : String;
  };

  // Admin actions
  action approveTravel(travelId : String) returns Travels;
  action rejectTravel(travelId : String)  returns Travels;
  action cancelTravel(travelId : String)  returns Travels;
}
