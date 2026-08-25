sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/ActionSheet",
    "sap/m/Button",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, ActionSheet, Button, MessageBox) {
    "use strict";

    return Controller.extend("travel.tracker.employee.controller.TravelList", {

        _sEmployeeId: "",
        _oUser: null,

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

            var sUser = sessionStorage.getItem("loggedInUser");
            if (sUser) {
                this._oUser = JSON.parse(sUser);
                this._sEmployeeId = this._oUser.id;
                this.byId("userName").setText(this._oUser.name);
                var aNames = this._oUser.name.split(" ");
                var sInitials = aNames.map(function(n) { return n.charAt(0); }).join("").substring(0, 2).toUpperCase();
                this.byId("userAvatar").setInitials(sInitials);
            } else {
                window.location.href = "/login/employee.html";
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

        onAvatarPress: function (oEvent) {
            var oAvatar = oEvent.getSource();
            var that = this;

            if (!this._oProfileMenu) {
                this._oProfileMenu = new ActionSheet({
                    title: this._oUser.name,
                    showCancelButton: true,
                    buttons: [
                        new Button({
                            text: "Profile",
                            icon: "sap-icon://person-placeholder",
                            press: function () {
                                MessageBox.information(
                                    "Name: " + that._oUser.name + "\n" +
                                    "Department: " + that._oUser.department + "\n" +
                                    "Role: " + that._oUser.role,
                                    { title: "My Profile" }
                                );
                            }
                        }),
                        new Button({
                            text: "Settings",
                            icon: "sap-icon://action-settings",
                            press: function () {
                                MessageToast.show("Settings coming soon");
                            }
                        }),
                        new Button({
                            text: "Privacy",
                            icon: "sap-icon://locked",
                            press: function () {
                                MessageToast.show("Privacy settings coming soon");
                            }
                        }),
                        new Button({
                            text: "Log Out",
                            icon: "sap-icon://log",
                            press: function () {
                                that.onLogout();
                            }
                        })
                    ]
                });
                this.getView().addDependent(this._oProfileMenu);
            }

            this._oProfileMenu.openBy(oAvatar);
        },

        onNotificationPress: function () {
            MessageToast.show("No new notifications");
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
            window.location.href = "/login/employee.html";
        },

        onTabSelect: function () {}
    });
});
