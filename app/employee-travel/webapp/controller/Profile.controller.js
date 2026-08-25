sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token"
], function (Controller, JSONModel, Token) {
    "use strict";

    return Controller.extend("travel.tracker.employee.controller.Profile", {

        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Profile")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var sUser = sessionStorage.getItem("loggedInUser");
            if (!sUser) {
                window.location.href = "/login/employee.html";
                return;
            }

            var oUser = JSON.parse(sUser);
            this._loadProfile(oUser.id);
        },

        _loadProfile: function (sEmployeeId) {
            var that = this;

            // Load employee details
            jQuery.ajax({
                url: "/travel/Employees('" + sEmployeeId + "')",
                success: function (emp) {
                    // Set avatar initials
                    var aNames = emp.name.split(" ");
                    var sInitials = aNames.map(function(n) { return n.charAt(0); }).join("").substring(0, 2).toUpperCase();
                    that.byId("profileAvatar").setInitials(sInitials);

                    // Set profile info
                    that.byId("profileName").setText(emp.name);
                    that.byId("profileRole").setText(emp.role === "admin" ? "Administrator" : "Employee");
                    that.byId("profileLastLogin").setText("Last login: " + new Date().toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    }));

                    that.byId("infoName").setText(emp.name);
                    that.byId("infoEmail").setText(emp.email);
                    that.byId("infoDept").setText(emp.department);
                    that.byId("infoManager").setText(emp.manager);
                    that.byId("infoId").setText(emp.ID);
                }
            });

            // Load travel stats
            jQuery.ajax({
                url: "/travel/Travels?$filter=employee_ID eq '" + sEmployeeId + "'",
                success: function (data) {
                    var aTravels = data.value || [];
                    var today = new Date().toISOString().split("T")[0];

                    var nCurrent = 0, nUpcoming = 0, nCompleted = 0;
                    var aCountries = [];
                    var aRecent = [];

                    aTravels.forEach(function (t) {
                        if (t.status === "Completed") {
                            nCompleted++;
                        } else if (t.startDate <= today && t.endDate >= today && t.status !== "Cancelled") {
                            nCurrent++;
                        } else if (t.startDate > today && t.status !== "Cancelled") {
                            nUpcoming++;
                        }

                        // Collect countries
                        if (t.travelType === "International" && t.toCountry && aCountries.indexOf(t.toCountry) === -1) {
                            aCountries.push(t.toCountry);
                        }

                        // Build recent list
                        var sDestination = t.travelType === "International" ? t.toCountry : (t.fromCity + " → " + t.toCity);
                        aRecent.push({
                            destination: sDestination,
                            startDate: t.startDate,
                            endDate: t.endDate,
                            status: t.status,
                            travelType: t.travelType
                        });
                    });

                    // Sort recent by startDate desc
                    aRecent.sort(function (a, b) {
                        return b.startDate.localeCompare(a.startDate);
                    });

                    // Set tile values
                    that.byId("totalTrips").setValue(aTravels.length);
                    that.byId("currentTrips").setValue(nCurrent);
                    that.byId("upcomingTrips").setValue(nUpcoming);
                    that.byId("completedTrips").setValue(nCompleted);

                    // Set countries as tokens
                    var oCountriesBox = that.byId("countriesBox");
                    oCountriesBox.removeAllItems();
                    aCountries.forEach(function (c) {
                        oCountriesBox.addItem(new Token({ text: c, editable: false }));
                    });

                    // Set recent travels list
                    var oProfileModel = new JSONModel(aRecent.slice(0, 5));
                    that.byId("recentTravelsList").setModel(oProfileModel, "profile");
                    that.byId("recentTravelsList").bindItems({
                        path: "profile>/",
                        template: new sap.m.StandardListItem({
                            title: "{profile>destination}",
                            description: "{profile>startDate} → {profile>endDate}",
                            icon: {
                                path: "profile>travelType",
                                formatter: function (t) {
                                    return t === "International" ? "sap-icon://globe" : "sap-icon://map";
                                }
                            },
                            info: "{profile>status}",
                            infoState: {
                                path: "profile>status",
                                formatter: function (s) {
                                    if (s === "Completed") return "None";
                                    if (s === "Travelling") return "Warning";
                                    if (s === "Approved") return "Success";
                                    if (s === "Cancelled") return "Error";
                                    return "Information";
                                }
                            }
                        })
                    });
                }
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("TravelList");
        }
    });
});
