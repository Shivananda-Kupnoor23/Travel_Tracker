sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("travel.tracker.admin.controller.CountryDetail", {

        onInit: function () {
            this.oViewModel = new JSONModel({
                country: "",
                count: 0,
                travels: []
            });
            this.getView().setModel(this.oViewModel, "viewModel");

            this.getOwnerComponent().getRouter()
                .getRoute("CountryDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sCountry = decodeURIComponent(oEvent.getParameter("arguments").country);
            this.oViewModel.setProperty("/country", sCountry);
            this._loadCountryTravels(sCountry);
        },

        _loadCountryTravels: function (sCountry) {
            var that = this;
            var today = new Date().toISOString().split('T')[0];

            jQuery.ajax({
                url: "/travel/Travels?$filter=toCountry eq '" + encodeURIComponent(sCountry) +
                     "' and startDate le " + today + " and endDate ge " + today +
                     "&$expand=employee",
                success: function (data) {
                    var aTravels = data.value || [];
                    that.oViewModel.setProperty("/travels", aTravels);
                    that.oViewModel.setProperty("/count", aTravels.length);
                }
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("Dashboard");
        }
    });
});
