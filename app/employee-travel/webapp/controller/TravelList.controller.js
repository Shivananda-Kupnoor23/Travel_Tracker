sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("travel.tracker.employee.controller.TravelList", {

        _sEmployeeId: "e003", // default employee

        onInit: function () {
            this.oViewModel = new JSONModel({
                currentTravels: [],
                upcomingTravels: [],
                pastTravels: [],
                currentCount: 0,
                upcomingCount: 0,
                pastCount: 0
            });
            this.getView().setModel(this.oViewModel, "viewModel");

            this.getOwnerComponent().getRouter()
                .getRoute("TravelList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadEmployees();
            this._loadTravels();
        },

        _loadEmployees: function () {
            var that = this;

            jQuery.ajax({
                url: "/travel/Employees",
                success: function (data) {
                    var aEmployees = data.value || [];
                    var oSelect = that.byId("employeeSelect");
                    if (!oSelect) return;

                    oSelect.removeAllItems();
                    aEmployees.forEach(function (emp) {
                        oSelect.addItem(new sap.ui.core.Item({
                            key: emp.ID,
                            text: emp.name + " (" + emp.department + ")"
                        }));
                    });
                    oSelect.setSelectedKey(that._sEmployeeId);
                }
            });
        },

        _loadTravels: function () {
            var that = this;
            var today = new Date().toISOString().split('T')[0];

            jQuery.ajax({
                url: "/travel/Travels?$filter=employee_ID eq '" + that._sEmployeeId + "'&$expand=employee",
                success: function (data) {
                    var aTravels = data.value || [];
                    var current = [], upcoming = [], past = [];

                    aTravels.forEach(function (t) {
                        if (t.status === 'Cancelled' || t.status === 'Completed') {
                            past.push(t);
                        } else if (t.startDate <= today && t.endDate >= today) {
                            current.push(t);
                        } else if (t.startDate > today) {
                            upcoming.push(t);
                        } else {
                            past.push(t);
                        }
                    });

                    that.oViewModel.setData({
                        currentTravels: current,
                        upcomingTravels: upcoming,
                        pastTravels: past,
                        currentCount: current.length,
                        upcomingCount: upcoming.length,
                        pastCount: past.length
                    });
                }
            });
        },

        onEmployeeChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            this._sEmployeeId = sKey;
            this._loadTravels();
        },

        onAddTravel: function () {
            this.getOwnerComponent().getRouter().navTo("TravelCreate");
        },

        onTravelPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oCtx = oItem.getBindingContext("viewModel");
            var sId = oCtx.getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("TravelDetail", { travelId: sId });
        },

        onTabSelect: function () {}
    });
});
