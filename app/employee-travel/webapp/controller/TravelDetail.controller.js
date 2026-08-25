sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("travel.tracker.employee.controller.TravelDetail", {

        onInit: function () {
            this.oViewModel = new JSONModel({
                mode: "display",
                pageTitle: "Travel Details",
                travel: {}
            });
            this.getView().setModel(this.oViewModel, "viewModel");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("TravelDetail").attachPatternMatched(this._onDetailMatched, this);
            oRouter.getRoute("TravelCreate").attachPatternMatched(this._onCreateMatched, this);
        },

        _getEmployeeId: function () {
            var sUser = sessionStorage.getItem("loggedInUser");
            if (sUser) {
                return JSON.parse(sUser).id;
            }
            return "";
        },

        _onDetailMatched: function (oEvent) {
            var sTravelId = oEvent.getParameter("arguments").travelId;
            this._loadTravel(sTravelId);
            this.oViewModel.setProperty("/mode", "display");
            this.oViewModel.setProperty("/pageTitle", "Travel Details");
        },

        _onCreateMatched: function () {
            this.oViewModel.setProperty("/mode", "create");
            this.oViewModel.setProperty("/pageTitle", "New Travel");
            this.oViewModel.setProperty("/travel", {
                travelType: "Domestic",
                fromCountry: "India",
                toCountry: "",
                fromCity: "",
                toCity: "",
                startDate: "",
                endDate: "",
                purpose: "",
                passportNumber: "",
                visaStatus: "",
                status: "Planned"
            });
        },

        _loadTravel: function (sTravelId) {
            var that = this;
            jQuery.ajax({
                url: "/travel/Travels('" + sTravelId + "')",
                success: function (data) {
                    that.oViewModel.setProperty("/travel", data);
                }
            });
        },

        onTravelTypeChange: function (oEvent) {
            var iIndex = oEvent.getParameter("selectedIndex");
            var sType = iIndex === 1 ? "International" : "Domestic";
            this.oViewModel.setProperty("/travel/travelType", sType);

            if (sType === "Domestic") {
                this.oViewModel.setProperty("/travel/fromCountry", "India");
                this.oViewModel.setProperty("/travel/toCountry", "India");
                this.oViewModel.setProperty("/travel/passportNumber", "");
                this.oViewModel.setProperty("/travel/visaStatus", "");
            } else {
                this.oViewModel.setProperty("/travel/fromCountry", "India");
                this.oViewModel.setProperty("/travel/fromCity", "");
                this.oViewModel.setProperty("/travel/toCity", "");
            }
        },

        onEdit: function () {
            this.oViewModel.setProperty("/mode", "edit");
            this.oViewModel.setProperty("/pageTitle", "Edit Travel");
        },

        onCancelEdit: function () {
            var sMode = this.oViewModel.getProperty("/mode");
            if (sMode === "create") {
                this.onNavBack();
            } else {
                var sTravelId = this.oViewModel.getProperty("/travel/ID");
                this._loadTravel(sTravelId);
                this.oViewModel.setProperty("/mode", "display");
                this.oViewModel.setProperty("/pageTitle", "Travel Details");
            }
        },

        onSave: function () {
            var that = this;
            var oTravel = this.oViewModel.getProperty("/travel");
            var sMode = this.oViewModel.getProperty("/mode");

            // Validation
            if (!oTravel.startDate || !oTravel.endDate) {
                MessageToast.show("Please fill in start and end dates");
                return;
            }
            if (oTravel.travelType === "Domestic" && (!oTravel.fromCity || !oTravel.toCity)) {
                MessageToast.show("Please fill in from and to cities");
                return;
            }
            if (oTravel.travelType === "International" && !oTravel.toCountry) {
                MessageToast.show("Please fill in destination country");
                return;
            }

            if (sMode === "create") {
                var sEmployeeId = this._getEmployeeId();
                var oPayload = {
                    employee_ID: sEmployeeId,
                    travelType: oTravel.travelType,
                    fromCountry: oTravel.travelType === "Domestic" ? "India" : (oTravel.fromCountry || "India"),
                    toCountry: oTravel.travelType === "Domestic" ? "India" : oTravel.toCountry,
                    fromCity: oTravel.travelType === "Domestic" ? oTravel.fromCity : "",
                    toCity: oTravel.travelType === "Domestic" ? oTravel.toCity : "",
                    startDate: oTravel.startDate,
                    endDate: oTravel.endDate,
                    purpose: oTravel.purpose || "",
                    status: "Planned",
                    passportNumber: oTravel.travelType === "International" ? (oTravel.passportNumber || "") : "",
                    visaStatus: oTravel.travelType === "International" ? (oTravel.visaStatus || "") : ""
                };

                jQuery.ajax({
                    url: "/travel/Travels",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function () {
                        MessageToast.show("Travel created successfully!");
                        that.onNavBack();
                    },
                    error: function () {
                        MessageBox.error("Error creating travel");
                    }
                });
            } else {
                // Edit mode
                var oPatchData = {
                    travelType: oTravel.travelType,
                    fromCountry: oTravel.fromCountry,
                    toCountry: oTravel.toCountry,
                    fromCity: oTravel.fromCity || "",
                    toCity: oTravel.toCity || "",
                    startDate: oTravel.startDate,
                    endDate: oTravel.endDate,
                    purpose: oTravel.purpose || "",
                    passportNumber: oTravel.passportNumber || "",
                    visaStatus: oTravel.visaStatus || ""
                };

                jQuery.ajax({
                    url: "/travel/Travels('" + oTravel.ID + "')",
                    method: "PATCH",
                    contentType: "application/json",
                    data: JSON.stringify(oPatchData),
                    success: function () {
                        MessageToast.show("Travel updated successfully!");
                        that.oViewModel.setProperty("/mode", "display");
                        that.oViewModel.setProperty("/pageTitle", "Travel Details");
                    },
                    error: function () {
                        MessageBox.error("Error updating travel");
                    }
                });
            }
        },

        onCancelTravel: function () {
            var that = this;
            var sTravelId = this.oViewModel.getProperty("/travel/ID");

            MessageBox.confirm("Are you sure you want to cancel this travel?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        jQuery.ajax({
                            url: "/travel/cancelTravel",
                            method: "POST",
                            contentType: "application/json",
                            data: JSON.stringify({ travelId: sTravelId }),
                            success: function () {
                                MessageToast.show("Travel cancelled");
                                that.onNavBack();
                            },
                            error: function () {
                                MessageBox.error("Error cancelling travel");
                            }
                        });
                    }
                }
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("TravelList");
        }
    });
});
