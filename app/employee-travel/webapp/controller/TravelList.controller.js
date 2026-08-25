sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("travel.tracker.employee.controller.TravelList", {

        _sEmployeeId: "",

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

            // Read logged-in user from sessionStorage
            var sUser = sessionStorage.getItem("loggedInUser");
            if (sUser) {
                var oUser = JSON.parse(sUser);
                this._sEmployeeId = oUser.id;
                this.byId("userName").setText(oUser.name);
                this.byId("userDept").setText(oUser.department);
            } else {
                // No session — redirect to login
                window.location.href = "../login/employee.html";
                return;
            }

            this.getOwnerComponent().getRouter()
                .getRoute("TravelList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadTravels();
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

        onAddTravel: function () {
            this.getOwnerComponent().getRouter().navTo("TravelCreate");
        },

        onTravelPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oCtx = oItem.getBindingContext("viewModel");
            var sId = oCtx.getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("TravelDetail", { travelId: sId });
        },

        onLogout: function () {
            sessionStorage.removeItem("loggedInUser");
            window.location.href = "../login/employee.html";
        },

        onTabSelect: function () {}
    });
});
