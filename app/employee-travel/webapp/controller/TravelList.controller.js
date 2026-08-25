sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("travel.tracker.employee.controller.TravelList", {

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

            // Load employee list for selector
            this._loadEmployees();

            // Load travels when view is shown
            this.getOwnerComponent().getRouter()
                .getRoute("TravelList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadTravels();
        },

        _loadEmployees: function () {
            var that = this;
            var oModel = this.getOwnerComponent().getModel();
            var oBinding = oModel.bindList("/Employees");

            oBinding.requestContexts(0, 100).then(function (aContexts) {
                var aEmployees = aContexts.map(function (oCtx) {
                    return oCtx.getObject();
                });

                var oSelect = that.byId("employeeSelect");
                oSelect.removeAllItems();
                aEmployees.forEach(function (emp) {
                    oSelect.addItem(new sap.ui.core.Item({
                        key: emp.ID,
                        text: emp.name + " (" + emp.department + ")"
                    }));
                });
            });
        },

        _loadTravels: function () {
            var that = this;
            var sEmployeeId = this.getOwnerComponent().getModel("app").getProperty("/employeeId");
            var oModel = this.getOwnerComponent().getModel();
            var today = new Date().toISOString().split('T')[0];

            var oBinding = oModel.bindList("/Travels", null, null, [
                new Filter("employee_ID", FilterOperator.EQ, sEmployeeId)
            ], {
                $expand: "employee"
            });

            oBinding.requestContexts(0, 200).then(function (aContexts) {
                var aTravels = aContexts.map(function (oCtx) {
                    return oCtx.getObject();
                });

                var current = [], upcoming = [], past = [];

                aTravels.forEach(function (t) {
                    if (t.status === 'Cancelled') {
                        past.push(t);
                    } else if (t.status === 'Completed') {
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
            });
        },

        onEmployeeChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            this.getOwnerComponent().getModel("app").setProperty("/employeeId", sKey);
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

        onTabSelect: function () {
            // Tab selection handled by IconTabBar binding
        }
    });
});
